package com.example.multitenant.service;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;

@Service
public class TotpService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private static final int TIME_STEP_SECONDS = 30;

    public String generateSecretKey() {
        byte[] buffer = new byte[20];
        SECURE_RANDOM.nextBytes(buffer);
        return encodeBase32(buffer);
    }

    public String getQrCodeUri(String username, String secret, String tenantId) {
        String issuer = "Multitenant-SaaS (" + tenantId + ")";
        String label = issuer + ":" + username;
        return String.format("otpauth://totp/%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30",
                URLEncoder.encode(label, StandardCharsets.UTF_8),
                secret,
                URLEncoder.encode(issuer, StandardCharsets.UTF_8));
    }

    public boolean verifyCode(String secret, int code) {
        if (secret == null || secret.isBlank()) return false;
        long currentWindow = System.currentTimeMillis() / 1000 / TIME_STEP_SECONDS;
        // Check current window and +/- 1 window for clock drift
        for (int i = -1; i <= 1; i++) {
            if (generateTotp(secret, currentWindow + i) == code) {
                return true;
            }
        }
        return false;
    }

    private int generateTotp(String secret, long timeWindow) {
        try {
            byte[] key = decodeBase32(secret);
            byte[] data = ByteBuffer.allocate(8).putLong(timeWindow).array();
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);

            int offset = hash[hash.length - 1] & 0xf;
            int binary = ((hash[offset] & 0x7f) << 24) |
                         ((hash[offset + 1] & 0xff) << 16) |
                         ((hash[offset + 2] & 0xff) << 8) |
                         (hash[offset + 3] & 0xff);

            return binary % 1000000;
        } catch (Exception e) {
            return -1;
        }
    }

    private String encodeBase32(byte[] data) {
        StringBuilder sb = new StringBuilder((data.length * 8 + 4) / 5);
        int buffer = 0;
        int next = 0;
        int bitsLeft = 0;
        while (next < data.length) {
            buffer <<= 8;
            buffer |= data[next++] & 0xff;
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                sb.append(BASE32_CHARS.charAt((buffer >> (bitsLeft - 5)) & 31));
                bitsLeft -= 5;
            }
        }
        if (bitsLeft > 0) {
            buffer <<= (5 - bitsLeft);
            sb.append(BASE32_CHARS.charAt(buffer & 31));
        }
        return sb.toString();
    }

    private byte[] decodeBase32(String base32) {
        String cleaned = base32.trim().toUpperCase().replace("=", "");
        byte[] result = new byte[cleaned.length() * 5 / 8];
        int buffer = 0;
        int bitsLeft = 0;
        int count = 0;
        for (char c : cleaned.toCharArray()) {
            int val = BASE32_CHARS.indexOf(c);
            if (val < 0) continue;
            buffer <<= 5;
            buffer |= val & 31;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                result[count++] = (byte) ((buffer >> (bitsLeft - 8)) & 0xff);
                bitsLeft -= 8;
            }
        }
        return Arrays.copyOf(result, count);
    }
}
