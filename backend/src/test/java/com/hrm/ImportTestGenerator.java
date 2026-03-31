package com.hrm;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import java.io.FileOutputStream;

public class ImportTestGenerator {
    @Test
    public void generateImportFile() throws Exception {
        try (Workbook workbook = new XSSFWorkbook(); FileOutputStream out = new FileOutputStream("test_import_final.xlsx")) {
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
            for (int i = 0; i < columns.length; i++) {
                headerRow.createCell(i).setCellValue(columns[i]);
            }
            
            // Row 1: Valid (15M)
            Row row1 = sheet.createRow(1);
            row1.createCell(0).setCellValue("Final Test 1");
            row1.createCell(1).setCellValue("final1@company.com");
            row1.createCell(2).setCellValue("0911111111");
            row1.createCell(3).setCellValue("ACTIVE");
            row1.createCell(4).setCellValue("FULL_TIME");
            row1.createCell(5).setCellValue(15000000);
            row1.createCell(6).setCellValue("2026-01-01");

            // Row 2: Probation (8M)
            Row row2 = sheet.createRow(2);
            row2.createCell(0).setCellValue("Final Test 2");
            row2.createCell(1).setCellValue("final2@company.com");
            row2.createCell(2).setCellValue("0922222222");
            row2.createCell(3).setCellValue("PROBATION");
            row2.createCell(4).setCellValue("PROBATION");
            row2.createCell(5).setCellValue(8500000);
            row2.createCell(6).setCellValue("2026-03-01");

            // Row 3: Duplicate Email (expected to fail)
            Row row3 = sheet.createRow(3);
            row3.createCell(0).setCellValue("Dup");
            row3.createCell(1).setCellValue("hr@company.com");
            row3.createCell(2).setCellValue("0933333333");
            row3.createCell(3).setCellValue("ACTIVE");
            row3.createCell(4).setCellValue("FULL_TIME");
            row3.createCell(5).setCellValue(10000000);
            
            workbook.write(out);
        }
    }
}
