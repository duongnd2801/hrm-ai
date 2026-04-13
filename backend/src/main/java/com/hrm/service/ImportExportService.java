package com.hrm.service;

import com.hrm.dto.EmployeeDTO;
import com.hrm.dto.PayrollDTO;
import com.hrm.dto.ImportErrorResponse;
import com.hrm.dto.ImportResultResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.commons.io.input.BOMInputStream;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.apache.poi.ss.util.CellRangeAddress;

@Service
public class ImportExportService {

    public byte[] exportEmployeesToExcel(List<EmployeeDTO> employees) throws Exception {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Danh sách nhân viên");

            // --- 1. ĐỊNH NGHĨA STYLE ---
            CellStyle baseStyle = workbook.createCellStyle();
            baseStyle.setBorderTop(BorderStyle.THIN);
            baseStyle.setBorderBottom(BorderStyle.THIN);
            baseStyle.setBorderLeft(BorderStyle.THIN);
            baseStyle.setBorderRight(BorderStyle.THIN);
            baseStyle.setAlignment(HorizontalAlignment.CENTER);
            baseStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            baseStyle.setWrapText(true);

            Font boldFont = workbook.createFont();
            boldFont.setBold(true);
            boldFont.setFontHeightInPoints((short) 10);

            // Group: CƠ BẢN (Xanh lá nhạt)
            CellStyle styleGeneral = workbook.createCellStyle();
            styleGeneral.cloneStyleFrom(baseStyle);
            styleGeneral.setFont(boldFont);
            styleGeneral.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            styleGeneral.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Group: HỢP ĐỒNG (Cam nhạt)
            CellStyle styleContract = workbook.createCellStyle();
            styleContract.cloneStyleFrom(baseStyle);
            styleContract.setFont(boldFont);
            styleContract.setFillForegroundColor(IndexedColors.LIGHT_ORANGE.getIndex());
            styleContract.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Group: THÂM NIÊN (Cam đậm)
            CellStyle styleSeniority = workbook.createCellStyle();
            styleSeniority.cloneStyleFrom(baseStyle);
            styleSeniority.setFont(boldFont);
            styleSeniority.setFillForegroundColor(IndexedColors.ORANGE.getIndex());
            styleSeniority.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Group: CÁ NHÂN (Vàng nhạt)
            CellStyle stylePersonal = workbook.createCellStyle();
            stylePersonal.cloneStyleFrom(baseStyle);
            stylePersonal.setFont(boldFont);
            stylePersonal.setFillForegroundColor(IndexedColors.LEMON_CHIFFON.getIndex());
            stylePersonal.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Group: NGƯỜI THÂN (Nâu nhạt)
            CellStyle styleRelative = workbook.createCellStyle();
            styleRelative.cloneStyleFrom(baseStyle);
            styleRelative.setFont(boldFont);
            styleRelative.setFillForegroundColor(IndexedColors.TAN.getIndex());
            styleRelative.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Group: TRÌNH ĐỘ (Xanh Teal)
            CellStyle styleEdu = workbook.createCellStyle();
            styleEdu.cloneStyleFrom(baseStyle);
            styleEdu.setFillForegroundColor(IndexedColors.SEA_GREEN.getIndex());
            styleEdu.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font lightFont = workbook.createFont();
            lightFont.setBold(true);
            lightFont.setColor(IndexedColors.WHITE.getIndex());
            styleEdu.setFont(lightFont);

            // --- 2. TẠO HEADER 2 TẦNG ---
            Row row0 = sheet.createRow(0);
            Row row1 = sheet.createRow(1);
            row0.setHeightInPoints(30);
            row1.setHeightInPoints(45);

            String[] subHeaders = {
                "STT", "ID", "Họ và tên", "Giới tính", "Ngày sinh", 
                "Quản lý cấp 1", "Quản lý cấp 2", "Vị trí", "Loại HĐ", "HĐ Hiệu lực", "HĐ Hết hạn", "Hạn đánh giá", "Ngày bắt đầu", "Ngày nghỉ",
                "Thâm niên", 
                "Địa chỉ", "Điện thoại", "Email cá nhân", "Số CCCD", "Ngày cấp", "Nơi cấp", 
                "Họ tên (NT)", "Quan hệ", "Điện thoại (NT)", 
                "Ngôn ngữ", "Chuyên ngành", "Trường ĐT", "Hệ", "Năm tốt nghiệp", "Chứng chỉ khác"
            };

            for (int i = 0; i < subHeaders.length; i++) {
                row0.createCell(i).setCellStyle(styleGeneral);
                Cell c1 = row1.createCell(i);
                c1.setCellValue(subHeaders[i]);
                c1.setCellStyle(styleGeneral);
            }

            // Gộp ô & Đặt tên nhóm
            // Nhóm 1: Cơ bản (0-4)
            for (int i = 0; i <= 4; i++) {
                sheet.addMergedRegion(new CellRangeAddress(0, 1, i, i));
                row0.getCell(i).setCellValue(subHeaders[i]);
            }

            // Nhóm 2: Hợp đồng (5-13)
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 5, 13));
            row0.getCell(5).setCellValue("THÔNG TIN HỢP ĐỒNG HIỆN TẠI");
            for (int i = 5; i <= 13; i++) {
                row0.getCell(i).setCellStyle(styleContract);
                row1.getCell(i).setCellStyle(styleContract);
            }

            // Nhóm 3: Thâm niên (14)
            sheet.addMergedRegion(new CellRangeAddress(0, 1, 14, 14));
            row0.getCell(14).setCellValue("Thâm niên");
            row0.getCell(14).setCellStyle(styleSeniority);
            row1.getCell(14).setCellStyle(styleSeniority);

            // Nhóm 4: Cá nhân (15-20)
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 15, 20));
            row0.getCell(15).setCellValue("THÔNG TIN CÁ NHÂN");
            for (int i = 15; i <= 20; i++) {
                row0.getCell(i).setCellStyle(stylePersonal);
                row1.getCell(i).setCellStyle(stylePersonal);
            }

            // Nhóm 5: Người thân (21-23)
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 21, 23));
            row0.getCell(21).setCellValue("THÔNG TIN NGƯỜI THÂN");
            for (int i = 21; i <= 23; i++) {
                row0.getCell(i).setCellStyle(styleRelative);
                row1.getCell(i).setCellStyle(styleRelative);
            }

            // Nhóm 6: Trình độ (24-29)
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 24, 29));
            row0.getCell(24).setCellValue("TRÌNH ĐỘ");
            for (int i = 24; i <= 29; i++) {
                row0.getCell(i).setCellStyle(styleEdu);
                row1.getCell(i).setCellStyle(styleEdu);
            }

            // --- 3. ĐỔ DỮ LIỆU ---
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            LocalDate today = LocalDate.now();
            int rIdx = 2;

            for (int i = 0; i < employees.size(); i++) {
                EmployeeDTO e = employees.get(i);
                Row row = sheet.createRow(rIdx++);
                int c = 0;

                row.createCell(c++).setCellValue(i + 1);
                row.createCell(c++).setCellValue(e.getId() != null ? e.getId().toString().substring(0, 8).toUpperCase() : "");
                row.createCell(c++).setCellValue(e.getFullName());
                row.createCell(c++).setCellValue(e.getGender() != null ? (e.getGender().name().equals("MALE") ? "Nam" : (e.getGender().name().equals("FEMALE") ? "Nữ" : "Khác")) : "");
                row.createCell(c++).setCellValue(e.getBirthDate() != null ? e.getBirthDate().format(formatter) : "");

                // Contract
                row.createCell(c++).setCellValue(e.getManagerName());
                row.createCell(c++).setCellValue(e.getManager2Name());
                row.createCell(c++).setCellValue(e.getPositionName());
                
                String contractTypeVn = "-";
                if (e.getContractType() != null) {
                    switch (e.getContractType().name()) {
                        case "FULL_TIME": contractTypeVn = "Toàn thời gian"; break;
                        case "PART_TIME": contractTypeVn = "Bán thời gian"; break;
                        case "CONTRACT": contractTypeVn = "Hợp đồng"; break;
                        case "PROBATION": contractTypeVn = "Thử việc"; break;
                        case "COLLABORATOR": contractTypeVn = "Cộng tác viên"; break;
                    }
                }
                row.createCell(c++).setCellValue(contractTypeVn);
                row.createCell(c++).setCellValue(e.getJoinDate() != null ? e.getJoinDate().format(formatter) : "");
                row.createCell(c++).setCellValue(e.getEndDate() != null ? e.getEndDate().format(formatter) : "");
                row.createCell(c++).setCellValue(e.getJoinDate() != null ? e.getJoinDate().format(formatter) : "");
                row.createCell(c++).setCellValue(e.getStartDate() != null ? e.getStartDate().format(formatter) : "");
                row.createCell(c++).setCellValue(e.getEndDate() != null ? e.getEndDate().format(formatter) : "");

                // Seniority
                LocalDate start = e.getJoinDate() != null ? e.getJoinDate() : e.getStartDate();
                String seniorityText = "-";
                if (start != null) {
                    long mTotal = ChronoUnit.MONTHS.between(start, today);
                    if (mTotal < 1) seniorityText = "Mới";
                    else if (mTotal < 12) seniorityText = mTotal + " tháng";
                    else seniorityText = (mTotal/12) + " năm " + (mTotal%12) + " tháng";
                }
                row.createCell(c++).setCellValue(seniorityText);

                // Personal
                row.createCell(c++).setCellValue(e.getAddress());
                row.createCell(c++).setCellValue(e.getPhone());
                row.createCell(c++).setCellValue(e.getPersonalEmail());
                row.createCell(c++).setCellValue(e.getCitizenId());
                row.createCell(c++).setCellValue(e.getCitizenIdDate() != null ? e.getCitizenIdDate().format(formatter) : "");
                row.createCell(c++).setCellValue(e.getCitizenIdPlace());

                // Relative
                row.createCell(c++).setCellValue(e.getEmergencyContactName());
                row.createCell(c++).setCellValue(e.getEmergencyContactRelationship());
                row.createCell(c++).setCellValue(e.getEmergencyContactPhone());

                // Edu
                row.createCell(c++).setCellValue(e.getProgrammingLanguages());
                row.createCell(c++).setCellValue(e.getMajor());
                row.createCell(c++).setCellValue(e.getUniversity());
                row.createCell(c++).setCellValue(e.getEducationLevel());
                row.createCell(c++).setCellValue(e.getGraduationYear() != null ? e.getGraduationYear() : 0);
                row.createCell(c++).setCellValue(e.getItCertificate());

                // Style borders for data row
                for (int j = 0; j < c; j++) {
                    Cell cell = row.getCell(j);
                    CellStyle dataStyle = workbook.createCellStyle();
                    dataStyle.setBorderBottom(BorderStyle.THIN);
                    dataStyle.setBorderTop(BorderStyle.THIN);
                    dataStyle.setBorderLeft(BorderStyle.THIN);
                    dataStyle.setBorderRight(BorderStyle.THIN);
                    cell.setCellStyle(dataStyle);
                }
            }

            for (int i = 0; i < subHeaders.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(bos);
            return bos.toByteArray();
        }
    }
    
    public byte[] generateTemplate() throws Exception {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Template");
            Row headerRow = sheet.createRow(0);
            String[] columns = {
                "Họ và tên (*)", "Email (*)", "Giới tính (MALE/FEMALE/OTHER)", "Ngày sinh (YYYY-MM-DD)",
                "Loại HĐ (FULL_TIME/PART_TIME/CONTRACT/PROBATION/COLLABORATOR)",
                "Ngày bắt đầu HĐ (YYYY-MM-DD)", "Hạn HĐ (YYYY-MM-DD)", "Ngày vào (YYYY-MM-DD)", "Ngày ký HĐ (YYYY-MM-DD)",
                "Địa chỉ", "Điện thoại", "Email cá nhân",
                "Số CCCD", "Ngày cấp CCCD (YYYY-MM-DD)", "Nơi cấp CCCD",
                "NT - Họ tên", "NT - Quan hệ", "NT - SĐT",
                "Ngôn ngữ lập trình", "Chuyên ngành", "Trường đào tạo",
                "Hệ (ĐH/CĐ)", "Năm cấp bằng", "Chứng chỉ CNTT",
                "Trạng thái (ACTIVE/INACTIVE/CONTRACT/PROBATION/COLLABORATOR)",
                "Lương cơ bản"
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
            int c = 0;
            exampleRow.createCell(c++).setCellValue("Nguyễn Văn A");
            exampleRow.createCell(c++).setCellValue("a.nguyen@company.com");
            exampleRow.createCell(c++).setCellValue("MALE");
            exampleRow.createCell(c++).setCellValue("1995-06-15");
            exampleRow.createCell(c++).setCellValue("FULL_TIME");
            exampleRow.createCell(c++).setCellValue("2026-01-01");
            exampleRow.createCell(c++).setCellValue("2027-01-01");
            exampleRow.createCell(c++).setCellValue("2026-01-01");
            exampleRow.createCell(c++).setCellValue("2025-12-28");
            exampleRow.createCell(c++).setCellValue("123 Nguyễn Du, Q.1, TP.HCM");
            exampleRow.createCell(c++).setCellValue("0912345678");
            exampleRow.createCell(c++).setCellValue("a.nguyen@gmail.com");
            exampleRow.createCell(c++).setCellValue("079095012345");
            exampleRow.createCell(c++).setCellValue("2020-01-15");
            exampleRow.createCell(c++).setCellValue("CA TP. Hồ Chí Minh");
            exampleRow.createCell(c++).setCellValue("Nguyễn Thị B");
            exampleRow.createCell(c++).setCellValue("Mẹ");
            exampleRow.createCell(c++).setCellValue("0987654321");
            exampleRow.createCell(c++).setCellValue("Java, Python, TypeScript");
            exampleRow.createCell(c++).setCellValue("Công nghệ phần mềm");
            exampleRow.createCell(c++).setCellValue("ĐH Bách Khoa TP.HCM");
            exampleRow.createCell(c++).setCellValue("Đại học");
            exampleRow.createCell(c++).setCellValue(2020);
            exampleRow.createCell(c++).setCellValue("AWS SAA, CCNA");
            exampleRow.createCell(c++).setCellValue("ACTIVE");
            exampleRow.createCell(c++).setCellValue(10000000);
            
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

                // Extended fields (optional) - parse remaining columns
                parseExtendedFields(row, dto, 7);
                
                list.add(dto);
            }
        }
        return list;
    }

    /**
     * Parse employee Excel with detailed error tracking per row
     */
    public ImportResultResponse parseEmployeeExcelWithValidation(MultipartFile file) throws Exception {
        List<EmployeeDTO> validRows = new ArrayList<>();
        List<ImportErrorResponse> errors = new ArrayList<>();
        int totalRows = 0;

        try (BOMInputStream bomIn = new BOMInputStream(file.getInputStream());
             Workbook workbook = new XSSFWorkbook(bomIn)) {

            Sheet sheet = workbook.getSheetAt(0);
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                totalRows++;
                int excelRowNum = i + 1; // 1-based Excel row number
                String email = "";
                List<String> rowErrors = new ArrayList<>();

                try {
                    EmployeeDTO dto = new EmployeeDTO();

                    // Col 0: Full Name (required)
                    Cell nameCell = row.getCell(0);
                    String name = (nameCell != null) ? nameCell.getStringCellValue().trim() : "";
                    if (name.isEmpty()) {
                        rowErrors.add("Tên nhân viên không được để trống");
                    } else {
                        dto.setFullName(name);
                    }

                    // Col 1: Email (required)
                    Cell emailCell = row.getCell(1);
                    email = (emailCell != null) ? emailCell.getStringCellValue().trim() : "";
                    if (email.isEmpty()) {
                        rowErrors.add("Email không được để trống");
                    } else if (!email.contains("@")) {
                        rowErrors.add("Email không hợp lệ");
                    } else {
                        dto.setEmail(email);
                    }

                    // Col 2: Phone
                    Cell phoneCell = row.getCell(2);
                    if (phoneCell != null) {
                        String phone = phoneCell.getStringCellValue().trim();
                        if (!phone.isEmpty()) dto.setPhone(phone);
                    }

                    // Col 3: Status
                    Cell statusCell = row.getCell(3);
                    if (statusCell != null) {
                        try {
                            String statusStr = statusCell.getStringCellValue().trim();
                            if (!statusStr.isEmpty()) {
                                dto.setStatus(com.hrm.entity.EmpStatus.valueOf(statusStr.toUpperCase()));
                            }
                        } catch (IllegalArgumentException e) {
                            rowErrors.add("Status không hợp lệ: " + statusCell.getStringCellValue());
                        }
                    }

                    // Col 4: Contract Type
                    Cell contractCell = row.getCell(4);
                    if (contractCell != null) {
                        try {
                            String contractStr = contractCell.getStringCellValue().trim();
                            if (!contractStr.isEmpty()) {
                                dto.setContractType(com.hrm.entity.ContractType.valueOf(contractStr.toUpperCase()));
                            }
                        } catch (IllegalArgumentException e) {
                            rowErrors.add("Contract type không hợp lệ: " + contractCell.getStringCellValue());
                        }
                    }

                    // Col 5: Base Salary
                    Cell salaryCell = row.getCell(5);
                    if (salaryCell != null) {
                        try {
                            double salary = salaryCell.getNumericCellValue();
                            if (salary > 0) {
                                dto.setBaseSalary((long) salary);
                            } else {
                                rowErrors.add("Lương cơ bản phải > 0");
                            }
                        } catch (IllegalStateException e) {
                            rowErrors.add("Lương cơ bản phải là số");
                        }
                    }

                    // Col 6: Start Date
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
                            rowErrors.add("Ngày vào làm phải định dạng YYYY-MM-DD");
                        }
                    } else {
                        dto.setStartDate(LocalDate.now());
                    }

                    // Extended fields (optional)
                    try {
                        parseExtendedFields(row, dto, 7);
                    } catch (Exception e) {
                        rowErrors.add("Lỗi parse thông tin mở rộng: " + e.getMessage());
                    }

                    // If no errors, add to valid rows
                    if (rowErrors.isEmpty()) {
                        validRows.add(dto);
                    } else {
                        errors.add(new ImportErrorResponse(excelRowNum, email, String.join("; ", rowErrors)));
                    }

                } catch (Exception e) {
                    errors.add(new ImportErrorResponse(excelRowNum, email, "Lỗi xử lý dòng: " + e.getMessage()));
                }
            }
        }

        return ImportResultResponse.builder()
                .totalRows(totalRows)
                .successCount(validRows.size())
                .failureCount(errors.size())
                .errors(errors)
                .message(validRows.size() + " hàng hợp lệ, " + errors.size() + " hàng có lỗi")
                .build();
    }

    /**
     * Parse extended employee fields from Excel row (columns after the base 7).
     * All fields are optional — gracefully skips if column is missing or empty.
     */
    private void parseExtendedFields(Row row, EmployeeDTO dto, int startCol) {
        // Note: Template column order after col 6 (Start Date):
        // 7: Hạn HĐ, 8: Ngày vào, 9: Ngày ký HĐ,
        // 10: Địa chỉ, 11: Điện thoại, 12: Email cá nhân,
        // 13: Số CCCD, 14: Ngày cấp CCCD, 15: Nơi cấp CCCD,
        // 16: NT Họ tên, 17: NT Quan hệ, 18: NT SĐT,
        // 19: Ngôn ngữ LT, 20: Chuyên ngành, 21: Trường ĐT,
        // 22: Hệ, 23: Năm cấp bằng, 24: Chứng chỉ CNTT,
        // 25: Trạng thái, 26: Lương cơ bản

        // Hạn HĐ (endDate)
        String endDateStr = getStringCell(row, startCol);
        if (!endDateStr.isEmpty()) {
            try { dto.setEndDate(LocalDate.parse(endDateStr)); } catch (Exception ignored) {}
        }

        // Ngày vào (joinDate)
        String joinDateStr = getStringCell(row, startCol + 1);
        if (!joinDateStr.isEmpty()) {
            try { dto.setJoinDate(LocalDate.parse(joinDateStr)); } catch (Exception ignored) {}
        }

        // Ngày ký HĐ
        String signingDateStr = getStringCell(row, startCol + 2);
        if (!signingDateStr.isEmpty()) {
            try { dto.setContractSigningDate(LocalDate.parse(signingDateStr)); } catch (Exception ignored) {}
        }

        // Địa chỉ (override if present)
        String address = getStringCell(row, startCol + 3);
        if (!address.isEmpty()) dto.setAddress(address);

        // Điện thoại (override if present)
        String phone = getStringCell(row, startCol + 4);
        if (!phone.isEmpty()) dto.setPhone(phone);

        // Email cá nhân
        String personalEmail = getStringCell(row, startCol + 5);
        if (!personalEmail.isEmpty()) dto.setPersonalEmail(personalEmail);

        // CCCD
        String citizenId = getStringCell(row, startCol + 6);
        if (!citizenId.isEmpty()) dto.setCitizenId(citizenId);

        String citizenIdDateStr = getStringCell(row, startCol + 7);
        if (!citizenIdDateStr.isEmpty()) {
            try { dto.setCitizenIdDate(LocalDate.parse(citizenIdDateStr)); } catch (Exception ignored) {}
        }

        String citizenIdPlace = getStringCell(row, startCol + 8);
        if (!citizenIdPlace.isEmpty()) dto.setCitizenIdPlace(citizenIdPlace);

        // Người thân liên hệ
        String ecName = getStringCell(row, startCol + 9);
        if (!ecName.isEmpty()) dto.setEmergencyContactName(ecName);

        String ecRelationship = getStringCell(row, startCol + 10);
        if (!ecRelationship.isEmpty()) dto.setEmergencyContactRelationship(ecRelationship);

        String ecPhone = getStringCell(row, startCol + 11);
        if (!ecPhone.isEmpty()) dto.setEmergencyContactPhone(ecPhone);

        // Trình độ
        String progLangs = getStringCell(row, startCol + 12);
        if (!progLangs.isEmpty()) dto.setProgrammingLanguages(progLangs);

        String major = getStringCell(row, startCol + 13);
        if (!major.isEmpty()) dto.setMajor(major);

        String university = getStringCell(row, startCol + 14);
        if (!university.isEmpty()) dto.setUniversity(university);

        String eduLevel = getStringCell(row, startCol + 15);
        if (!eduLevel.isEmpty()) dto.setEducationLevel(eduLevel);

        // Năm cấp bằng (numeric)
        Cell gradYearCell = row.getCell(startCol + 16);
        if (gradYearCell != null) {
            try {
                int year = (int) gradYearCell.getNumericCellValue();
                if (year > 1900) dto.setGraduationYear(year);
            } catch (Exception ignored) {}
        }

        String itCert = getStringCell(row, startCol + 17);
        if (!itCert.isEmpty()) dto.setItCertificate(itCert);
    }

    /** Helper: safely read a cell as String */
    private String getStringCell(Row row, int colIdx) {
        Cell cell = row.getCell(colIdx);
        if (cell == null) return "";
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                return String.valueOf((long) cell.getNumericCellValue());
            }
            return cell.getStringCellValue().trim();
        } catch (Exception e) {
            return "";
        }
    }
}
