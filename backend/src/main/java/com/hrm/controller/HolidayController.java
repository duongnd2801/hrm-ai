package com.hrm.controller;

import com.hrm.dto.HolidayDTO;
import com.hrm.service.HolidayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/holidays")
public class HolidayController {

    @Autowired
    private HolidayService holidayService;

    @GetMapping("/{year}")
    @PreAuthorize("hasAuthority('HOLIDAY_VIEW')")
    public ResponseEntity<List<HolidayDTO>> getHolidays(@PathVariable Integer year) {
        return ResponseEntity.ok(holidayService.getHolidaysByYear(year));
    }

    @PutMapping("/{year}")
    @PreAuthorize("hasAuthority('HOLIDAY_MANAGE')")
    public ResponseEntity<List<HolidayDTO>> saveHolidays(@PathVariable Integer year, @RequestBody List<HolidayDTO> dtos) {
        return ResponseEntity.ok(holidayService.saveHolidays(year, dtos));
    }
}
