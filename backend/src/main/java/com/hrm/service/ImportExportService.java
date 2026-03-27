package com.hrm.service;

import com.hrm.dto.EmployeeDTO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.commons.io.input.BOMInputStream;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ImportExportService {

    public byte[] exportEmployeesToExcel(List<EmployeeDTO> employees) throws Exception {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            
            // Add UTF-8 BOM manually in the byte stream wrapper or keep it standard XSSF (usually UTF-8 natively)
            Sheet sheet = workbook.createSheet("Employees");
            
            Row headerRow = sheet.createRow(0);
            String[] columns = {"Full Name", "Email", "Phone", "Status", "Contract Type", "Base Salary"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
            }

            int rowIdx = 1;
            for (EmployeeDTO emp : employees) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(emp.getFullName() != null ? emp.getFullName() : "");
                row.createCell(1).setCellValue(emp.getEmail() != null ? emp.getEmail() : "");
                row.createCell(2).setCellValue(emp.getPhone() != null ? emp.getPhone() : "");
                row.createCell(3).setCellValue(emp.getStatus() != null ? emp.getStatus().name() : "");
                row.createCell(4).setCellValue(emp.getContractType() != null ? emp.getContractType().name() : "");
                row.createCell(5).setCellValue(emp.getBaseSalary() != null ? emp.getBaseSalary() : 0);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }
    
    public byte[] generateTemplate() throws Exception {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Template");
            Row headerRow = sheet.createRow(0);
            String[] columns = {"Full Name", "Email", "Phone", "Status", "Contract Type", "Start Date (YYYY-MM-DD)"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
            }
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public List<EmployeeDTO> parseEmployeeExcel(MultipartFile file) throws Exception {
        List<EmployeeDTO> list = new ArrayList<>();
        // Use BOMInputStream to handle UTF-8 BOM
        try (BOMInputStream bomIn = new BOMInputStream(file.getInputStream());
             Workbook workbook = new XSSFWorkbook(bomIn)) {
             
            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                
                EmployeeDTO dto = new EmployeeDTO();
                Cell nameCell = row.getCell(0);
                if (nameCell != null) dto.setFullName(nameCell.getStringCellValue());
                
                Cell emailCell = row.getCell(1);
                if (emailCell != null) dto.setEmail(emailCell.getStringCellValue());
                
                Cell phoneCell = row.getCell(2);
                if (phoneCell != null) dto.setPhone(phoneCell.getStringCellValue());
                
                // Add default start date for simplicity in parsing
                dto.setStartDate(LocalDate.now());
                list.add(dto);
            }
        }
        return list;
    }
}
