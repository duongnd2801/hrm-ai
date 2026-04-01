package com.hrm.service;

import com.hrm.dto.PayrollDTO;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
@RequiredArgsConstructor
public class PayrollPdfService {

    public byte[] generatePayrollStatement(PayrollDTO payroll) throws Exception {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(outputStream);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document = new Document(pdfDoc);

        document.setMargins(20, 20, 20, 20);

        PdfFont titleFont = createVietnameseFont(true);
        PdfFont headerFont = createVietnameseFont(true);
        PdfFont regularFont = createVietnameseFont(false);

        Paragraph title = new Paragraph("PHIẾU LƯƠNG THÁNG")
                .setFont(titleFont)
                .setFontSize(18)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(10);
        document.add(title);

        Paragraph monthYear = new Paragraph(
                String.format("Tháng %d năm %d", payroll.getMonth(), payroll.getYear())
        ).setFont(regularFont)
         .setFontSize(12)
         .setTextAlignment(TextAlignment.CENTER)
         .setMarginBottom(20);
        document.add(monthYear);

        Paragraph empName = new Paragraph("Nhân viên: " + (payroll.getEmployeeName() != null ? payroll.getEmployeeName() : "N/A"))
                .setFont(regularFont)
                .setFontSize(11)
                .setMarginBottom(5);
        document.add(empName);

        Paragraph empId = new Paragraph("Mã NV: " + (payroll.getEmployeeId() != null ? payroll.getEmployeeId() : "N/A"))
                .setFont(regularFont)
                .setFontSize(11)
                .setMarginBottom(20);
        document.add(empId);

        Table mainTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}));
        mainTable.setWidth(UnitValue.createPercentValue(100));
        mainTable.setMarginBottom(20);

        Cell leftHeader = new Cell().add(new Paragraph("THÀNH PHẦN THU NHẬP").setFont(headerFont)).setBold();
        Cell rightHeader = new Cell().add(new Paragraph("SỐ TIỀN").setFont(headerFont)).setBold();
        mainTable.addCell(leftHeader);
        mainTable.addCell(rightHeader);

        addRow(mainTable, "Lương cơ sở", formatVND(payroll.getBaseSalary() != null ? payroll.getBaseSalary() : 0), regularFont);
        addRow(mainTable, "Số ngày chuẩn", String.valueOf(payroll.getStandardDays() != null ? payroll.getStandardDays() : 0) + " ngày", regularFont);
        addRow(mainTable, "Số ngày thực tế", String.format("%.1f ngày", payroll.getActualDays() != null ? payroll.getActualDays() : 0.0), regularFont);

        long salaryByAttendance = Math.round(
                (payroll.getBaseSalary() != null ? payroll.getBaseSalary() : 0)
                        * (payroll.getActualDays() != null ? payroll.getActualDays() : 0.0)
                        / (payroll.getStandardDays() != null && payroll.getStandardDays() > 0 ? payroll.getStandardDays() : 1)
        );
        addRow(mainTable, "Lương thực tế", formatVND(salaryByAttendance), regularFont);
        addRow(mainTable, "Giờ OT", String.format("%.1f giờ", payroll.getOtHours() != null ? payroll.getOtHours() : 0.0), regularFont);
        addRow(mainTable, "Tiền OT", formatVND(payroll.getOtAmount() != null ? payroll.getOtAmount() : 0), regularFont);
        addRow(mainTable, "Phụ cấp", formatVND(payroll.getAllowance() != null ? payroll.getAllowance() : 0), regularFont);

        Cell grossLabel = new Cell().add(new Paragraph("TỔNG THU NHẬP").setFont(headerFont)).setBold();
        Cell grossValue = new Cell().add(new Paragraph(formatVND(payroll.getGrossSalary() != null ? payroll.getGrossSalary() : 0)).setFont(headerFont)).setBold();
        mainTable.addCell(grossLabel);
        mainTable.addCell(grossValue);

        document.add(mainTable);

        Table deductionTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}));
        deductionTable.setWidth(UnitValue.createPercentValue(100));
        deductionTable.setMarginBottom(20);

        Cell deductHeader = new Cell().add(new Paragraph("CÁC KHOẢN CHIẾT KHẤU").setFont(headerFont)).setBold();
        Cell deductValue = new Cell().add(new Paragraph("SỐ TIỀN").setFont(headerFont)).setBold();
        deductionTable.addCell(deductHeader);
        deductionTable.addCell(deductValue);

        addRow(deductionTable, "BHXH (8%)", formatVND(payroll.getBhxh() != null ? payroll.getBhxh() : 0), regularFont);
        addRow(deductionTable, "BHYT (1.5%)", formatVND(payroll.getBhyt() != null ? payroll.getBhyt() : 0), regularFont);
        addRow(deductionTable, "BHTN (1%)", formatVND(payroll.getBhtn() != null ? payroll.getBhtn() : 0), regularFont);
        addRow(deductionTable, "Thuế TNCN", formatVND(payroll.getIncomeTax() != null ? payroll.getIncomeTax() : 0), regularFont);

        long totalDeduction = (payroll.getBhxh() != null ? payroll.getBhxh() : 0)
                + (payroll.getBhyt() != null ? payroll.getBhyt() : 0)
                + (payroll.getBhtn() != null ? payroll.getBhtn() : 0)
                + (payroll.getIncomeTax() != null ? payroll.getIncomeTax() : 0);

        Cell totalDedLabel = new Cell().add(new Paragraph("TỔNG CHIẾT KHẤU").setFont(headerFont)).setBold();
        Cell totalDedValue = new Cell().add(new Paragraph(formatVND(totalDeduction)).setFont(headerFont)).setBold();
        deductionTable.addCell(totalDedLabel);
        deductionTable.addCell(totalDedValue);

        document.add(deductionTable);

        Table finalTable = new Table(UnitValue.createPercentArray(new float[]{50, 50}));
        finalTable.setWidth(UnitValue.createPercentValue(100));
        finalTable.setMarginBottom(30);

        Cell netLabel = new Cell().add(new Paragraph("LƯƠNG NHẬN").setFont(headerFont).setFontSize(13)).setBold();
        Cell netValue = new Cell().add(new Paragraph(formatVND(payroll.getNetSalary() != null ? payroll.getNetSalary() : 0)).setFont(headerFont).setFontSize(13)).setBold();
        finalTable.addCell(netLabel);
        finalTable.addCell(netValue);

        document.add(finalTable);

        if (payroll.getNote() != null && !payroll.getNote().isEmpty()) {
            Paragraph note = new Paragraph("Ghi chú: " + payroll.getNote())
                    .setFont(regularFont)
                    .setFontSize(10)
                    .setMarginTop(15);
            document.add(note);
        }

        Paragraph footer = new Paragraph("Phiếu này được cấp bởi hệ thống Quản lý Nhân sự HRM")
                .setFont(regularFont)
                .setFontSize(9)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(30);
        document.add(footer);

        document.close();
        return outputStream.toByteArray();
    }

    private PdfFont createVietnameseFont(boolean bold) throws Exception {
        String[] fontCandidates = bold
                ? new String[]{
                "C:/Windows/Fonts/arialbd.ttf",
                "C:/Windows/Fonts/tahomabd.ttf",
                "C:/Windows/Fonts/timesbd.ttf",
                "C:/Windows/Fonts/arial.ttf"
        }
                : new String[]{
                "C:/Windows/Fonts/arial.ttf",
                "C:/Windows/Fonts/tahoma.ttf",
                "C:/Windows/Fonts/times.ttf"
        };

        for (String fontPath : fontCandidates) {
            if (Files.exists(Path.of(fontPath))) {
                return PdfFontFactory.createFont(
                        fontPath,
                        PdfEncodings.IDENTITY_H,
                        PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED
                );
            }
        }

        throw new IllegalStateException("Không tìm thấy font Unicode để render tiếng Việt trong PDF.");
    }

    private void addRow(Table table, String label, String value, PdfFont font) {
        Cell labelCell = new Cell().add(new Paragraph(label).setFont(font));
        Cell valueCell = new Cell().add(new Paragraph(value).setFont(font)).setTextAlignment(TextAlignment.RIGHT);
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private String formatVND(long amount) {
        return String.format("%,d VND", amount);
    }
}
