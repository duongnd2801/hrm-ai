package com.hrm.service;

import com.hrm.config.CacheNames;
import com.hrm.dto.HolidayDTO;
import com.hrm.entity.Holiday;
import com.hrm.repository.HolidayRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class HolidayService {

    @Autowired
    private HolidayRepository holidayRepository;

    @Cacheable(value = CacheNames.HOLIDAYS, key = "#year")
    public List<HolidayDTO> getHolidaysByYear(Integer year) {
        return holidayRepository.findAllByYearOrderByDateAsc(year)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = CacheNames.HOLIDAYS, key = "#year")
    public List<HolidayDTO> saveHolidays(Integer year, List<HolidayDTO> dtos) {
        holidayRepository.deleteAllByYear(year);
        holidayRepository.flush(); // Bắt buộc flush để xóa trướcc khi insert, tránh lỗi Duplicate UNIQUE date do Hibernate ưu tiên INSERT trước DELETE
        
        List<Holiday> holidays = dtos.stream().map(dto -> {
            Holiday h = new Holiday();
            h.setDate(dto.getDate());
            h.setName(dto.getName());
            h.setYear(year);
            h.setIsPaidLeave(dto.getIsPaidLeave() != null ? dto.getIsPaidLeave() : true);
            return h;
        }).collect(Collectors.toList());
        
        List<Holiday> saved = holidayRepository.saveAllAndFlush(holidays);
        
        return saved.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    private HolidayDTO mapToDTO(Holiday h) {
        HolidayDTO dto = new HolidayDTO();
        dto.setId(h.getId());
        dto.setDate(h.getDate());
        dto.setName(h.getName());
        dto.setYear(h.getYear());
        dto.setIsPaidLeave(h.getIsPaidLeave());
        return dto;
    }
}
