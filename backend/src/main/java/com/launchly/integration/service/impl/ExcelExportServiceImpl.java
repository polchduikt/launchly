package com.launchly.integration.service.impl;

import com.launchly.bot.entity.Bot;
import com.launchly.bot.repository.BotRepository;
import com.launchly.common.exception.AppException;
import com.launchly.crm.entity.Lead;
import com.launchly.crm.entity.Order;
import com.launchly.crm.repository.LeadRepository;
import com.launchly.crm.repository.OrderRepository;
import com.launchly.integration.dto.ExportDataType;
import com.launchly.integration.dto.response.ExcelExportResult;
import com.launchly.integration.service.ExcelExportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelExportServiceImpl implements ExcelExportService {

    private final OrderRepository orderRepository;
    private final LeadRepository leadRepository;
    private final BotRepository botRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    @Transactional(readOnly = true)
    public ExcelExportResult export(Long botId, ExportDataType dataType, Long userId) {
        byte[] data = switch (dataType) {
            case ORDERS -> exportOrders(botId, userId);
            case LEADS -> exportLeads(botId, userId);
        };

        String filename = switch (dataType) {
            case ORDERS -> "orders_export.xlsx";
            case LEADS -> "leads_export.xlsx";
        };

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ExcelExportResult(data, headers);
    }

    private byte[] exportOrders(Long botId, Long userId) {
        validateBotOwnership(botId, userId);
        List<Order> orders = orderRepository.findByBotIdOrderByCreatedAtDesc(botId);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Orders");
            String[] headers = {"ID", "Order Number", "Status", "Total Amount", "Currency", "Notes", "Items", "Customer Telegram ID", "Customer Name", "Created At"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            int rowIdx = 1;
            for (Order order : orders) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(order.getId() != null ? order.getId() : 0L);
                row.createCell(1).setCellValue(order.getOrderNumber() != null ? order.getOrderNumber() : "");
                row.createCell(2).setCellValue(order.getStatus() != null ? order.getStatus().name() : "");
                row.createCell(3).setCellValue(order.getTotalAmount() != null ? order.getTotalAmount().doubleValue() : 0.0);
                row.createCell(4).setCellValue(order.getCurrency() != null ? order.getCurrency() : "");
                row.createCell(5).setCellValue(order.getNotes() != null ? order.getNotes() : "");
                row.createCell(6).setCellValue(order.getItems() != null ? order.getItems() : "");
                row.createCell(7).setCellValue(order.getBotUser() != null && order.getBotUser().getTelegramId() != null ? order.getBotUser().getTelegramId() : 0L);

                String customerName = "";
                if (order.getBotUser() != null) {
                    String firstName = order.getBotUser().getFirstName() != null ? order.getBotUser().getFirstName() : "";
                    String lastName = order.getBotUser().getLastName() != null ? order.getBotUser().getLastName() : "";
                    customerName = (firstName + " " + lastName).trim();
                }
                row.createCell(8).setCellValue(customerName);
                row.createCell(9).setCellValue(order.getCreatedAt() != null ? order.getCreatedAt().format(DATE_FORMATTER) : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(bos);
            return bos.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate Excel orders export: {}", e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "integration.error.excel_export_failed");
        }
    }

    private byte[] exportLeads(Long botId, Long userId) {
        validateBotOwnership(botId, userId);
        List<Lead> leads = leadRepository.findByBotIdOrderByCreatedAtDesc(botId);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Leads");
            String[] headers = {"ID", "Name", "Email", "Phone", "Source", "Status", "Notes", "Data", "Customer Telegram ID", "Created At"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            int rowIdx = 1;
            for (Lead lead : leads) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(lead.getId() != null ? lead.getId() : 0L);
                row.createCell(1).setCellValue(lead.getName() != null ? lead.getName() : "");
                row.createCell(2).setCellValue(lead.getEmail() != null ? lead.getEmail() : "");
                row.createCell(3).setCellValue(lead.getPhone() != null ? lead.getPhone() : "");
                row.createCell(4).setCellValue(lead.getSource() != null ? lead.getSource() : "");
                row.createCell(5).setCellValue(lead.getStatus() != null ? lead.getStatus().name() : "");
                row.createCell(6).setCellValue(lead.getNotes() != null ? lead.getNotes() : "");
                row.createCell(7).setCellValue(lead.getData() != null ? lead.getData() : "");
                row.createCell(8).setCellValue(lead.getBotUser() != null && lead.getBotUser().getTelegramId() != null ? lead.getBotUser().getTelegramId() : 0L);
                row.createCell(9).setCellValue(lead.getCreatedAt() != null ? lead.getCreatedAt().format(DATE_FORMATTER) : "");
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            workbook.write(bos);
            return bos.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate Excel leads export: {}", e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "integration.error.excel_export_failed");
        }
    }

    private Bot validateBotOwnership(Long botId, Long userId) {
        return botRepository.findByIdAndUserId(botId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "bot.error.access_denied"));
    }
}