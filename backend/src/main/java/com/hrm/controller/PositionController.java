package com.hrm.controller;

import com.hrm.dto.PositionDTO;
import com.hrm.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/company/positions")
@RequiredArgsConstructor
public class PositionController {

    private final CompanyService companyService;

    @GetMapping
    @PreAuthorize("hasAuthority('POS_VIEW')")
    public ResponseEntity<List<PositionDTO>> getAll() {
        return ResponseEntity.ok(companyService.getAllPositions());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('POS_CREATE')")
    public ResponseEntity<PositionDTO> create(@Valid @RequestBody PositionDTO dto) {
        return ResponseEntity.ok(companyService.createPosition(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('POS_UPDATE')")
    public ResponseEntity<PositionDTO> update(@PathVariable UUID id, @Valid @RequestBody PositionDTO dto) {
        return ResponseEntity.ok(companyService.updatePosition(id, dto));
    }

    @PatchMapping("/{id}/lock")
    @PreAuthorize("hasAuthority('POS_UPDATE')")
    public ResponseEntity<PositionDTO> toggleLock(@PathVariable UUID id, @RequestParam boolean locked) {
        return ResponseEntity.ok(companyService.togglePositionLock(id, locked));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('POS_DELETE')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        companyService.deletePosition(id);
        return ResponseEntity.noContent().build();
    }
}
