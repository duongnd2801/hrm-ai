import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import java.io.FileOutputStream;

public class GenerateExcel {
    public static void main(String[] args) throws Exception {
        try (Workbook workbook = new XSSFWorkbook(); FileOutputStream out = new FileOutputStream("test_import.xlsx")) {
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
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
            }
            
            // Success Row 1
            Row row1 = sheet.createRow(1);
            row1.createCell(0).setCellValue("Excel User 1");
            row1.createCell(1).setCellValue("excel1@company.com");
            row1.createCell(2).setCellValue("0911111111");
            row1.createCell(3).setCellValue("ACTIVE");
            row1.createCell(4).setCellValue("FULL_TIME");
            row1.createCell(5).setCellValue(15000000);
            row1.createCell(6).setCellValue("2026-01-01");

            // Success Row 2
            Row row2 = sheet.createRow(2);
            row2.createCell(0).setCellValue("Excel User 2");
            row2.createCell(1).setCellValue("excel2@company.com");
            row2.createCell(2).setCellValue("0922222222");
            row2.createCell(3).setCellValue("PROBATION");
            row2.createCell(4).setCellValue("PROBATION");
            row2.createCell(5).setCellValue(8000000);
            row2.createCell(6).setCellValue("2026-03-01");

            // Error Row (Email duplicate or missing name - let's do a success one first to prove it works)
            Row row3 = sheet.createRow(3);
            row3.createCell(0).setCellValue("Excel User 3");
            row3.createCell(1).setCellValue("excel3@company.com");
            row3.createCell(2).setCellValue("0933333333");
            row3.createCell(3).setCellValue("CONTRACT");
            row3.createCell(4).setCellValue("CONTRACT");
            row3.createCell(5).setCellValue(12000000);
            row3.createCell(6).setCellValue("2026-02-15");
            
            workbook.write(out);
            System.out.println("Generated test_import.xlsx successfully.");
        }
    }
}
