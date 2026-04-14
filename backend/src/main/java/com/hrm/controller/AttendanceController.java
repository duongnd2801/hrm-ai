package com.hrm.controller;

import com.hrm.dto.ImportResultResponse;
import com.hrm.dto.AttendanceDTO;
import com.hrm.dto.AttendanceSummaryDTO;
import com.hrm.service.AttendanceService;
import com.hrm.service.ImportExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final ImportExportService importExportService;

    @PostMapping("/checkin")
    @PreAuthorize("hasAuthority('ATT_CHECKIN')")
    public ResponseEntity<AttendanceDTO> checkIn(Authentication authentication) {
        return ResponseEntity.ok(attendanceService.checkIn(authentication));
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasAuthority('ATT_CHECKIN')")
    public ResponseEntity<AttendanceDTO> checkOut(Authentication authentication) {
        return ResponseEntity.ok(attendanceService.checkOut(authentication));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAuthority('ATT_VIEW')")
    public ResponseEntity<List<AttendanceDTO>> getMyAttendance(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            Authentication authentication
    ) {
        return ResponseEntity.ok(attendanceService.getMyAttendance(month, year, authentication));
    }

    @GetMapping("/{employeeId}")
    @PreAuthorize("hasAuthority('ATT_TEAM_VIEW')")
    public ResponseEntity<List<AttendanceDTO>> getEmployeeAttendance(
            @PathVariable UUID employeeId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            Authentication authentication
    ) {
        return ResponseEntity.ok(attendanceService.getAttendanceForEmployee(employeeId, month, year, authentication));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority('ATT_TEAM_VIEW')")
    public ResponseEntity<List<AttendanceSummaryDTO>> getTeamSummary(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            Authentication authentication
    ) {
        return ResponseEntity.ok(attendanceService.getTeamSummary(month, year, authentication));
    }

    @PostMapping("/import-machine")
    @PreAuthorize("hasAuthority('ATT_IMPORT')")
    public ResponseEntity<ImportResultResponse<AttendanceDTO>> importMachineAttendance(
            @RequestParam("file") MultipartFile file) throws Exception {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn file Excel.");
        }
        ImportResultResponse<AttendanceDTO> parsed = importExportService.parseMachineAttendanceExcel(file);
        return ResponseEntity.ok(attendanceService.importMachineAttendance(parsed));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<String> handleDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGeneral(Exception ex) {
        // Log is needed here for debugging — in prod add a logger
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Lỗi xử lý chấm công: " + ex.getMessage());
    }
}
