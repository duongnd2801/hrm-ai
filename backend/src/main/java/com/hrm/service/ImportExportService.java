package com.hrm.service;

import com.hrm.dto.EmployeeDTO;
import com.hrm.dto.PayrollDTO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.commons.io.input.BOMInputStream;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
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
            String[] columns = {
                "Full Name", 
                "Email", 
                "Phone", 
                "Status (ACTIVE/INACTIVE/CONTRACT/PROBATION/COLLABORATOR)", 
                "Contract Type (FULL_TIME/PART_TIME/CONTRACT/PROBATION/COLLABORATOR)",
                "Base Salary", 
                "Start Date (YYYY-MM-DD)"
            };
            
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.BLUE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // Add example row
            Row exampleRow = sheet.createRow(1);
            exampleRow.createCell(0).setCellValue("Nguyễn Văn A");
            exampleRow.createCell(1).setCellValue("a.nguyen@company.com");
            exampleRow.createCell(2).setCellValue("0912345678");
            exampleRow.createCell(3).setCellValue("ACTIVE");
            exampleRow.createCell(4).setCellValue("FULL_TIME");
            exampleRow.createCell(5).setCellValue(10000000);
            exampleRow.createCell(6).setCellValue("2026-01-01");
            
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportPayrollToExcel(List<PayrollDTO> payrolls, int month, int year) throws Exception {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Bang_luong_" + month + "_" + year);
            
            String[] columns = {"Nhân viên", "Lương cơ bản", "Ngày công thực", "Ngày công chuẩn", "Lương OT", "Phụ cấp", "Tổng thu nhập", "BHXH (8%)", "BHYT (1.5%)", "BHTN (1%)", "Thuế TNCN", "Thực nhận"};
            Row headerRow = sheet.createRow(0);
            
            CellStyle headStyle = workbook.createCellStyle();
            Font headFont = workbook.createFont();
            headFont.setBold(true);
            headStyle.setFont(headFont);
            headStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headStyle.setBorderBottom(BorderStyle.THIN);
            headStyle.setAlignment(HorizontalAlignment.CENTER);

            // Money format style
            DataFormat format = workbook.createDataFormat();
            CellStyle moneyStyle = workbook.createCellStyle();
            moneyStyle.setDataFormat(format.getFormat("#,##0")); // Format 1.000.000
            moneyStyle.setBorderBottom(BorderStyle.THIN);

            CellStyle textStyle = workbook.createCellStyle();
            textStyle.setBorderBottom(BorderStyle.THIN);

            CellStyle numberStyle = workbook.createCellStyle();
            numberStyle.setAlignment(HorizontalAlignment.CENTER);
            numberStyle.setBorderBottom(BorderStyle.THIN);

            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headStyle);
            }

            int rowIdx = 1;
            for (PayrollDTO p : payrolls) {
                Row row = sheet.createRow(rowIdx++);
                
                Cell c0 = row.createCell(0);
                c0.setCellValue(p.getEmployeeName() != null ? p.getEmployeeName() : "N/A");
                c0.setCellStyle(textStyle);

                Cell c1 = row.createCell(1);
                c1.setCellValue(p.getBaseSalary() != null ? p.getBaseSalary().doubleValue() : 0.0);
                c1.setCellStyle(moneyStyle);

                Cell c2 = row.createCell(2);
                c2.setCellValue(p.getActualDays() != null ? p.getActualDays() : 0.0);
                c2.setCellStyle(numberStyle);

                Cell c3 = row.createCell(3);
                c3.setCellValue(p.getStandardDays() != null ? p.getStandardDays().doubleValue() : 0.0);
                c3.setCellStyle(numberStyle);

                Cell c4 = row.createCell(4);
                c4.setCellValue(p.getOtAmount() != null ? p.getOtAmount().doubleValue() : 0.0);
                c4.setCellStyle(moneyStyle);

                Cell c5 = row.createCell(5);
                c5.setCellValue(p.getAllowance() != null ? p.getAllowance().doubleValue() : 0.0);
                c5.setCellStyle(moneyStyle);

                Cell c6 = row.createCell(6);
                c6.setCellValue(p.getGrossSalary() != null ? p.getGrossSalary().doubleValue() : 0.0);
                c6.setCellStyle(moneyStyle);

                Cell c7 = row.createCell(7);
                c7.setCellValue(p.getBhxh() != null ? p.getBhxh().doubleValue() : 0.0);
                c7.setCellStyle(moneyStyle);

                Cell c8 = row.createCell(8);
                c8.setCellValue(p.getBhyt() != null ? p.getBhyt().doubleValue() : 0.0);
                c8.setCellStyle(moneyStyle);

                Cell c9 = row.createCell(9);
                c9.setCellValue(p.getBhtn() != null ? p.getBhtn().doubleValue() : 0.0);
                c9.setCellStyle(moneyStyle);

                Cell c10 = row.createCell(10);
                c10.setCellValue(p.getIncomeTax() != null ? p.getIncomeTax().doubleValue() : 0.0);
                c10.setCellStyle(moneyStyle);

                Cell c11 = row.createCell(11);
                c11.setCellValue(p.getNetSalary() != null ? p.getNetSalary().doubleValue() : 0.0);
                c11.setCellStyle(moneyStyle);
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
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
                
                // Col 0: Full Name (required)
                Cell nameCell = row.getCell(0);
                if (nameCell != null && !nameCell.getStringCellValue().trim().isEmpty()) {
                    dto.setFullName(nameCell.getStringCellValue().trim());
                } else {
                    throw new IllegalArgumentException("Tên nhân viên không được để trống");
                }
                
                // Col 1: Email (required)
                Cell emailCell = row.getCell(1);
                if (emailCell != null && !emailCell.getStringCellValue().trim().isEmpty()) {
                    dto.setEmail(emailCell.getStringCellValue().trim());
                } else {
                    throw new IllegalArgumentException("Email không được để trống");
                }
                
                // Col 2: Phone
                Cell phoneCell = row.getCell(2);
                if (phoneCell != null) {
                    String phone = phoneCell.getStringCellValue().trim();
                    if (!phone.isEmpty()) dto.setPhone(phone);
                }
                
                // Col 3: Status (ACTIVE, INACTIVE, ...)
                Cell statusCell = row.getCell(3);
                if (statusCell != null) {
                    try {
                        String statusStr = statusCell.getStringCellValue().trim();
                        if (!statusStr.isEmpty()) {
                            dto.setStatus(com.hrm.entity.EmpStatus.valueOf(statusStr.toUpperCase()));
                        }
                    } catch (IllegalArgumentException e) {
                        throw new IllegalArgumentException("Status không hợp lệ: " + statusCell.getStringCellValue());
                    }
                }
                
                // Col 4: Contract Type (FULL_TIME, PART_TIME, ...)
                Cell contractCell = row.getCell(4);
                if (contractCell != null) {
                    try {
                        String contractStr = contractCell.getStringCellValue().trim();
                        if (!contractStr.isEmpty()) {
                            dto.setContractType(com.hrm.entity.ContractType.valueOf(contractStr.toUpperCase()));
                        }
                    } catch (IllegalArgumentException e) {
                        throw new IllegalArgumentException("Contract type không hợp lệ: " + contractCell.getStringCellValue());
                    }
                }
                
                // Col 5: Base Salary (numeric)
                Cell salaryCell = row.getCell(5);
                if (salaryCell != null) {
                    try {
                        double salary = salaryCell.getNumericCellValue();
                        if (salary > 0) {
                            dto.setBaseSalary((long) salary);
                        } else {
                            throw new IllegalArgumentException("Lương cơ bản phải > 0");
                        }
                    } catch (IllegalStateException e) {
                        throw new IllegalArgumentException("Lương cơ bản phải là số");
                    }
                }
                
                // Col 6: Start Date (YYYY-MM-DD)
                Cell startDateCell = row.getCell(6);
                if (startDateCell != null) {
                    try {
                        String dateStr = startDateCell.getStringCellValue().trim();
                        if (!dateStr.isEmpty()) {
                            dto.setStartDate(LocalDate.parse(dateStr));
                        } else {
                            dto.setStartDate(LocalDate.now());
                        }
                    } catch (Exception e) {
                        throw new IllegalArgumentException("Ngày vào làm phải định dạng YYYY-MM-DD");
                    }
                } else {
                    dto.setStartDate(LocalDate.now());
                }
                
                list.add(dto);
            }
        }
        return list;
    }
}
