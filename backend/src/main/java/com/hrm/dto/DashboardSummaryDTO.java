package com.hrm.dto;

import com.hrm.entity.AttendanceStatus;
import lombok.Data;

@Data
public class DashboardSummaryDTO {
    private String today;
    private AttendanceStatus todayAttendanceStatus;
    private String todayCheckIn;
    private String todayCheckOut;
    private Long myPendingApologies;
    private Long myPendingLeaveRequests;
    private Long pendingApologiesToReview;
    private Long pendingLeaveRequestsToReview;
}
