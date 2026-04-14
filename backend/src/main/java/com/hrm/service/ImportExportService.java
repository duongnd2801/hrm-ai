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
import com.hrm.dto.AttendanceDTO;
import java.text.Normalizer;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.regex.Pattern;
import java.util.UUID;

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

            // --- 2. TẠO HEADER 2 TẦNG + 1 DÒNG ĐẾM SỐ ---
            Row row0 = sheet.createRow(0);
            Row row1 = sheet.createRow(1);
            Row row2 = sheet.createRow(2);
            row0.setHeightInPoints(30);
            row1.setHeightInPoints(45);
            row2.setHeightInPoints(20);

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
                
                Cell c2 = row2.createCell(i);
                if (i == 4) c2.setCellValue("[dd/mm/yyyy]");
                else c2.setCellValue(String.valueOf(i + 1));
                c2.setCellStyle(styleGeneral);
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
                row2.getCell(i).setCellStyle(styleContract);
            }

            // Nhóm 3: Thâm niên (14)
            sheet.addMergedRegion(new CellRangeAddress(0, 1, 14, 14));
            row0.getCell(14).setCellValue("Thâm niên");
            row0.getCell(14).setCellStyle(styleSeniority);
            row1.getCell(14).setCellStyle(styleSeniority);
            row2.getCell(14).setCellStyle(styleSeniority);

            // Nhóm 4: Cá nhân (15-20)
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 15, 20));
            row0.getCell(15).setCellValue("THÔNG TIN CÁ NHÂN");
            for (int i = 15; i <= 20; i++) {
                row0.getCell(i).setCellStyle(stylePersonal);
                row1.getCell(i).setCellStyle(stylePersonal);
                row2.getCell(i).setCellStyle(stylePersonal);
            }

            // Nhóm 5: Người thân (21-23)
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 21, 23));
            row0.getCell(21).setCellValue("THÔNG TIN NGƯỜI THÂN");
            for (int i = 21; i <= 23; i++) {
                row0.getCell(i).setCellStyle(styleRelative);
                row1.getCell(i).setCellStyle(styleRelative);
                row2.getCell(i).setCellStyle(styleRelative);
            }

            // Nhóm 6: Trình độ (24-29)
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 24, 29));
            row0.getCell(24).setCellValue("TRÌNH ĐỘ");
            for (int i = 24; i <= 29; i++) {
                row0.getCell(i).setCellStyle(styleEdu);
                row1.getCell(i).setCellStyle(styleEdu);
                row2.getCell(i).setCellStyle(styleEdu);
            }

            // --- 3. ĐỔ DỮ LIỆU ---
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            LocalDate today = LocalDate.now();
            int rIdx = 3;

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
                    if (j == 0 || j == 7 || j == 28) {
                        dataStyle.setAlignment(HorizontalAlignment.CENTER);
                    }
                    cell.setCellStyle(dataStyle);
                }
            }

            int[] columnWidths = {
                13, 17, 25, 13, 17, // STT...Ngày sinh
                21, 21, 21, 21, 17, 17, 17, 17, 17, // Quản lý...Ngày nghỉ
                17, // Thâm niên
                34, 17, 30, 21, 17, 30, // Địa chỉ...Nơi cấp
                25, 17, 17, // Người thân
                25, 25, 45, 17, 17, 25 // Trình độ
            };
            for (int i = 0; i < subHeaders.length; i++) {
                sheet.setColumnWidth(i, columnWidths[i] * 256);
            }

            workbook.write(bos);
            return bos.toByteArray();
        }
    }
    
    public byte[] generateTemplate() throws Exception {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Template");

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

            CellStyle styleGeneral = workbook.createCellStyle();
            styleGeneral.cloneStyleFrom(baseStyle);
            styleGeneral.setFont(boldFont);
            styleGeneral.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            styleGeneral.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle styleContract = workbook.createCellStyle();
            styleContract.cloneStyleFrom(baseStyle);
            styleContract.setFont(boldFont);
            styleContract.setFillForegroundColor(IndexedColors.LIGHT_ORANGE.getIndex());
            styleContract.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle styleSeniority = workbook.createCellStyle();
            styleSeniority.cloneStyleFrom(baseStyle);
            styleSeniority.setFont(boldFont);
            styleSeniority.setFillForegroundColor(IndexedColors.ORANGE.getIndex());
            styleSeniority.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle stylePersonal = workbook.createCellStyle();
            stylePersonal.cloneStyleFrom(baseStyle);
            stylePersonal.setFont(boldFont);
            stylePersonal.setFillForegroundColor(IndexedColors.LEMON_CHIFFON.getIndex());
            stylePersonal.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle styleRelative = workbook.createCellStyle();
            styleRelative.cloneStyleFrom(baseStyle);
            styleRelative.setFont(boldFont);
            styleRelative.setFillForegroundColor(IndexedColors.TAN.getIndex());
            styleRelative.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle styleEdu = workbook.createCellStyle();
            styleEdu.cloneStyleFrom(baseStyle);
            styleEdu.setFillForegroundColor(IndexedColors.SEA_GREEN.getIndex());
            styleEdu.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font lightFont = workbook.createFont();
            lightFont.setBold(true);
            lightFont.setColor(IndexedColors.WHITE.getIndex());
            styleEdu.setFont(lightFont);

            // --- 2. TẠO HEADER 2 TẦNG + 1 DÒNG ĐẾM SỐ (30 cột y hệt Export) ---
            Row row0 = sheet.createRow(0);
            Row row1 = sheet.createRow(1);
            Row row2 = sheet.createRow(2);
            row0.setHeightInPoints(30);
            row1.setHeightInPoints(45);
            row2.setHeightInPoints(20);

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
                
                Cell c2 = row2.createCell(i);
                if (i == 4) c2.setCellValue("[dd/mm/yyyy]");
                else c2.setCellValue(String.valueOf(i + 1));
                c2.setCellStyle(styleGeneral);
            }

            for (int i = 0; i <= 4; i++) {
                sheet.addMergedRegion(new CellRangeAddress(0, 1, i, i));
                row0.getCell(i).setCellValue(subHeaders[i]);
            }

            sheet.addMergedRegion(new CellRangeAddress(0, 0, 5, 13));
            row0.getCell(5).setCellValue("THÔNG TIN HỢP ĐỒNG HIỆN TẠI");
            for (int i = 5; i <= 13; i++) {
                row0.getCell(i).setCellStyle(styleContract);
                row1.getCell(i).setCellStyle(styleContract);
                row2.getCell(i).setCellStyle(styleContract);
            }

            sheet.addMergedRegion(new CellRangeAddress(0, 1, 14, 14));
            row0.getCell(14).setCellValue("Thâm niên");
            row0.getCell(14).setCellStyle(styleSeniority);
            row1.getCell(14).setCellStyle(styleSeniority);
            row2.getCell(14).setCellStyle(styleSeniority);

            sheet.addMergedRegion(new CellRangeAddress(0, 0, 15, 20));
            row0.getCell(15).setCellValue("THÔNG TIN CÁ NHÂN");
            for (int i = 15; i <= 20; i++) {
                row0.getCell(i).setCellStyle(stylePersonal);
                row1.getCell(i).setCellStyle(stylePersonal);
                row2.getCell(i).setCellStyle(stylePersonal);
            }

            sheet.addMergedRegion(new CellRangeAddress(0, 0, 21, 23));
            row0.getCell(21).setCellValue("THÔNG TIN NGƯỜI THÂN");
            for (int i = 21; i <= 23; i++) {
                row0.getCell(i).setCellStyle(styleRelative);
                row1.getCell(i).setCellStyle(styleRelative);
                row2.getCell(i).setCellStyle(styleRelative);
            }

            sheet.addMergedRegion(new CellRangeAddress(0, 0, 24, 29));
            row0.getCell(24).setCellValue("TRÌNH ĐỘ");
            for (int i = 24; i <= 29; i++) {
                row0.getCell(i).setCellStyle(styleEdu);
                row1.getCell(i).setCellStyle(styleEdu);
                row2.getCell(i).setCellStyle(styleEdu);
            }

            // --- 3. ROW EXAMPLE ---
            Row exampleRow = sheet.createRow(3);
            for (int i = 0; i < subHeaders.length; i++) {
                exampleRow.createCell(i).setCellStyle(baseStyle);
            }
            exampleRow.getCell(0).setCellValue(1);
            exampleRow.getCell(1).setCellValue(""); // ID auto gen
            exampleRow.getCell(2).setCellValue("Nguyễn Văn Tuấn");
            exampleRow.getCell(3).setCellValue("Nam");
            exampleRow.getCell(4).setCellValue("15/06/1995");
            exampleRow.getCell(5).setCellValue(""); // Manager 1
            exampleRow.getCell(6).setCellValue(""); // Manager 2
            exampleRow.getCell(7).setCellValue(""); // Vị trí
            exampleRow.getCell(8).setCellValue("Toàn thời gian");
            exampleRow.getCell(9).setCellValue("01/01/2026");
            exampleRow.getCell(10).setCellValue("01/01/2027");
            exampleRow.getCell(11).setCellValue("");
            exampleRow.getCell(12).setCellValue("01/01/2026");
            exampleRow.getCell(13).setCellValue("");
            exampleRow.getCell(14).setCellValue("Mới");
            exampleRow.getCell(15).setCellValue("123 Nguyễn Du, TP.HCM");
            exampleRow.getCell(16).setCellValue("0912345678");
            exampleRow.getCell(17).setCellValue("tuan.nguyen@gmail.com");
            exampleRow.getCell(18).setCellValue("079095012345");
            exampleRow.getCell(19).setCellValue("15/01/2020");
            exampleRow.getCell(20).setCellValue("CA TP. Hồ Chí Minh");
            exampleRow.getCell(21).setCellValue("Nguyễn Thị Lan");
            exampleRow.getCell(22).setCellValue("Mẹ");
            exampleRow.getCell(23).setCellValue("0987654321");
            exampleRow.getCell(24).setCellValue("Java, Python");
            exampleRow.getCell(25).setCellValue("CNTT");
            exampleRow.getCell(26).setCellValue("ĐH Bách Khoa");
            exampleRow.getCell(27).setCellValue("Đại học");
            exampleRow.getCell(28).setCellValue("2020");
            exampleRow.getCell(29).setCellValue("AWS SAA");
            
            int[] columnWidths = {
                13, 17, 25, 13, 17, // STT...Ngày sinh
                21, 21, 21, 21, 17, 17, 17, 17, 17, // Quản lý...Ngày nghỉ
                17, // Thâm niên
                34, 17, 30, 21, 17, 30, // Địa chỉ...Nơi cấp
                25, 17, 17, // Người thân
                25, 25, 45, 17, 17, 25 // Trình độ
            };
            for (int i = 0; i < subHeaders.length; i++) {
                sheet.setColumnWidth(i, columnWidths[i] * 256);
            }
            
            workbook.write(bos);
            return bos.toByteArray();
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
        return parseEmployeeExcelWithValidation(file).getData(); 
    }

    private String generateEmailFromName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) return "employee" + System.currentTimeMillis() + "@company.com";
        String normalized = Normalizer.normalize(fullName.trim(), Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String ascii = pattern.matcher(normalized).replaceAll("").toLowerCase().replaceAll("đ", "d");
        
        String[] parts = ascii.split("\\s+");
        if (parts.length == 1) {
            return parts[0] + "@company.com";
        }
        StringBuilder email = new StringBuilder(parts[parts.length - 1]);
        for (int i = 0; i < parts.length - 1; i++) {
            if (!parts[i].isEmpty()) {
                email.append(parts[i].charAt(0));
            }
        }
        return email.toString() + "@company.com";
    }

    private LocalDate parseDateFlexible(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) return null;
        try {
            // Check if format is dd/MM/yyyy
            if (dateStr.contains("/")) {
                DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
                return LocalDate.parse(dateStr, dtf);
            }
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            return null;
        }
    }

    public ImportResultResponse<EmployeeDTO> parseEmployeeExcelWithValidation(MultipartFile file) throws Exception {
        List<EmployeeDTO> validRows = new ArrayList<>();
        List<ImportErrorResponse> errors = new ArrayList<>();
        int totalRows = 0;

        try (BOMInputStream bomIn = new BOMInputStream(file.getInputStream());
             Workbook workbook = new XSSFWorkbook(bomIn)) {

            Sheet sheet = workbook.getSheetAt(0);
            // Bắt đầu đọc từ dòng index 3 (Rows 0, 1 là header, Row 2 là đếm số)
            for (int i = 3; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                totalRows++;
                int excelRowNum = i + 1; // 1-based Excel row number
                List<String> rowErrors = new ArrayList<>();

                try {
                    EmployeeDTO dto = new EmployeeDTO();

                    // Col 2: Họ và tên
                    String name = getStringCell(row, 2);
                    if (name.isEmpty()) {
                        rowErrors.add("Tên nhân viên không được để trống");
                    } else {
                        dto.setFullName(name);
                        // Auto generate email
                        dto.setEmail(generateEmailFromName(name));
                        // Set basic defaults
                        dto.setBaseSalary(0L);
                        dto.setStatus(com.hrm.entity.EmpStatus.ACTIVE);
                    }

                    // Col 3: Giới tính
                    String genderStr = getStringCell(row, 3).toLowerCase();
                    if (genderStr.contains("nam")) dto.setGender(com.hrm.entity.GenderType.MALE);
                    else if (genderStr.contains("nữ") || genderStr.contains("nu")) dto.setGender(com.hrm.entity.GenderType.FEMALE);
                    else if (!genderStr.isEmpty()) dto.setGender(com.hrm.entity.GenderType.OTHER);

                    // Col 4: Ngày sinh
                    String birthStr = getStringCell(row, 4);
                    LocalDate birthDate = parseDateFlexible(birthStr);
                    if (birthDate != null) dto.setBirthDate(birthDate);

                    // Col 8: Loại HĐ
                    String contractType = getStringCell(row, 8).toLowerCase();
                    if (contractType.contains("toàn")) dto.setContractType(com.hrm.entity.ContractType.FULL_TIME);
                    else if (contractType.contains("bán")) dto.setContractType(com.hrm.entity.ContractType.PART_TIME);
                    else if (contractType.contains("hợp đồng")) dto.setContractType(com.hrm.entity.ContractType.CONTRACT);
                    else if (contractType.contains("thử việc")) dto.setContractType(com.hrm.entity.ContractType.PROBATION);
                    else if (contractType.contains("cộng tác")) dto.setContractType(com.hrm.entity.ContractType.COLLABORATOR);
                    else dto.setContractType(com.hrm.entity.ContractType.FULL_TIME); // default

                    // Col 9, 10: HĐ Hiệu lực, Hết hạn
                    LocalDate contractStartDate = parseDateFlexible(getStringCell(row, 9));
                    if (contractStartDate != null) dto.setJoinDate(contractStartDate);
                    
                    LocalDate contractEndDate = parseDateFlexible(getStringCell(row, 10));
                    if (contractEndDate != null) dto.setEndDate(contractEndDate);
                    
                    // Col 12: Ngày bắt đầu (StartDate)
                    LocalDate startDate = parseDateFlexible(getStringCell(row, 12));
                    if (startDate != null) dto.setStartDate(startDate);
                    else dto.setStartDate(LocalDate.now());

                    // Col 15: Địa chỉ
                    String address = getStringCell(row, 15);
                    if (!address.isEmpty()) dto.setAddress(address);

                    // Col 16: Điện thoại
                    String phone = getStringCell(row, 16);
                    if (!phone.isEmpty()) {
                        dto.setPhone(phone);
                    } else {
                        rowErrors.add("SĐT không được để trống");
                    }

                    // Col 17: Email cá nhân
                    String pEmail = getStringCell(row, 17);
                    if (!pEmail.isEmpty()) dto.setPersonalEmail(pEmail);

                    // Col 18: CCCD
                    String cccd = getStringCell(row, 18);
                    if (!cccd.isEmpty()) {
                        dto.setCitizenId(cccd);
                    } else {
                        rowErrors.add("CCCD không được để trống");
                    }

                    // Col 19: Ngày cấp CCCD
                    LocalDate cccdDate = parseDateFlexible(getStringCell(row, 19));
                    if (cccdDate != null) dto.setCitizenIdDate(cccdDate);

                    // Col 20: Nơi cấp CCCD
                    String cccdPlace = getStringCell(row, 20);
                    if (!cccdPlace.isEmpty()) dto.setCitizenIdPlace(cccdPlace);

                    // Col 21, 22, 23: Người thân
                    dto.setEmergencyContactName(getStringCell(row, 21));
                    dto.setEmergencyContactRelationship(getStringCell(row, 22));
                    dto.setEmergencyContactPhone(getStringCell(row, 23));

                    // Col 24..29: Trình độ
                    dto.setProgrammingLanguages(getStringCell(row, 24));
                    dto.setMajor(getStringCell(row, 25));
                    dto.setUniversity(getStringCell(row, 26));
                    dto.setEducationLevel(getStringCell(row, 27));
                    
                    String gradYear = getStringCell(row, 28);
                    try {
                        if (!gradYear.isEmpty()) dto.setGraduationYear(Integer.parseInt(gradYear));
                    } catch (Exception ignored) {}
                    
                    dto.setItCertificate(getStringCell(row, 29));

                    // If no errors, add to valid rows
                    if (rowErrors.isEmpty()) {
                        validRows.add(dto);
                    } else {
                        errors.add(new ImportErrorResponse(excelRowNum, dto.getEmail(), String.join("; ", rowErrors)));
                    }

                } catch (Exception e) {
                    errors.add(new ImportErrorResponse(excelRowNum, "Unknown", "Lỗi xử lý dòng: " + e.getMessage()));
                }
            }
        }

        return ImportResultResponse.<EmployeeDTO>builder()
                .totalRows(totalRows)
                .successCount(validRows.size())
                .failureCount(errors.size())
                .errors(errors)
                .data(validRows)
                .message(validRows.size() + " hàng hợp lệ, " + errors.size() + " hàng có lỗi")
                .build();
    }

    private void parseExtendedFields(Row row, EmployeeDTO dto, int startCol) {
        // Obsolete as we merged this into the main parser method
    }

    public ImportResultResponse<AttendanceDTO> parseMachineAttendanceExcel(MultipartFile file) throws Exception {
        List<AttendanceDTO> validRows = new ArrayList<>();
        List<ImportErrorResponse> errors = new ArrayList<>();
        int totalRows = 0;

        try (BOMInputStream bomIn = new BOMInputStream(file.getInputStream());
             Workbook workbook = new XSSFWorkbook(bomIn)) {

            Sheet sheet = workbook.getSheetAt(0);
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

            // Bắt đầu đọc từ dòng index 5 (Dòng 6 trong Excel máy chấm công)
            for (int i = 5; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                // Kiểm tra nếu dòng trống (STT hoặc Mã NV trống)
                String stt = getStringCell(row, 0);
                String rawEmpId = getStringCell(row, 1);
                if (stt.isEmpty() && rawEmpId.isEmpty()) continue;

                totalRows++;
                int excelRowNum = i + 1;
                List<String> rowErrors = new ArrayList<>();

                try {
                    AttendanceDTO dto = new AttendanceDTO();

                    // Cột B (index 1): Mã nhân viên (UUID)
                    if (rawEmpId.isEmpty()) {
                        rowErrors.add("Mã nhân viên không được để trống");
                    } else {
                        try {
                            // Trim and handle if it's a long UUID string
                            dto.setEmployeeId(UUID.fromString(rawEmpId.trim()));
                        } catch (Exception e) {
                            rowErrors.add("Mã nhân viên (UUID) không hợp lệ: " + rawEmpId);
                        }
                    }

                    // Cột E (index 4): Ngày (dd/MM/yyyy)
                    String dateStr = getStringCell(row, 4);
                    LocalDate date = parseDateFlexible(dateStr);
                    if (date == null) {
                        rowErrors.add("Ngày không hợp lệ: " + dateStr);
                    } else {
                        dto.setDate(date);
                    }

                    // Cột G (index 6): Giờ vào (HH:mm)
                    LocalTime checkInTime = getTimeCell(row, 6);
                    if (checkInTime != null && date != null) {
                        dto.setCheckIn(LocalDateTime.of(date, checkInTime));
                    }

                    // Cột H (index 7): Giờ ra (HH:mm)
                    LocalTime checkOutTime = getTimeCell(row, 7);
                    if (checkOutTime != null && date != null) {
                        dto.setCheckOut(LocalDateTime.of(date, checkOutTime));
                    }

                    // SKIP rows with no punches
                    if (checkInTime == null && checkOutTime == null) {
                        continue;
                    }

                    if (rowErrors.isEmpty()) {
                        validRows.add(dto);
                    } else {
                        errors.add(new ImportErrorResponse(excelRowNum, rawEmpId, String.join("; ", rowErrors)));
                    }

                } catch (Exception e) {
                    errors.add(new ImportErrorResponse(excelRowNum, rawEmpId, "Lỗi xử lý: " + e.getMessage()));
                }
            }
        }

        return ImportResultResponse.<AttendanceDTO>builder()
                .totalRows(totalRows)
                .successCount(validRows.size())
                .failureCount(errors.size())
                .errors(errors)
                .data(validRows)
                .message("Phân tích xong " + totalRows + " dòng, tìm thấy " + validRows.size() + " dòng hợp lệ.")
                .build();
    }

    private LocalTime getTimeCell(Row row, int colIdx) {
        Cell cell = row.getCell(colIdx);
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                return cell.getLocalDateTimeCellValue().toLocalTime();
            }
            String val = getStringCell(row, colIdx);
            if (val.isEmpty() || val.equals("0")) return null;
            
            // Handle HH:mm format
            return LocalTime.parse(val, DateTimeFormatter.ofPattern("HH:mm"));
        } catch (Exception e) {
            // Try fallback one more time for mixed formats
            try {
                String val = cell.toString().trim();
                if (val.length() == 5 && val.contains(":")) {
                    return LocalTime.parse(val);
                }
            } catch (Exception ignored) {}
            return null;
        }
    }

    /** Helper: safely read a cell as String */
    private String getStringCell(Row row, int colIdx) {
        Cell cell = row.getCell(colIdx);
        if (cell == null) return "";
        try {
            if (cell.getCellType() == CellType.NUMERIC) {
                // If it's a date/time formatted numeric cell, don't just cast to long
                if (DateUtil.isCellDateFormatted(cell)) {
                    // Try to format appropriately but mostly we use specific getters for those
                    return cell.getLocalDateTimeCellValue().toString();
                }
                double val = cell.getNumericCellValue();
                if (val == (long) val) return String.valueOf((long) val);
                return String.valueOf(val);
            }
            if (cell.getCellType() == CellType.STRING) {
                return cell.getStringCellValue().trim();
            }
            return cell.toString().trim();
        } catch (Exception e) {
            return "";
        }
    }
}
