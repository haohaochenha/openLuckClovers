package org.example.openluckclovers;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class OpenluckcloversApplication {

    public static void main(String[] args) {
        SpringApplication.run(OpenluckcloversApplication.class, args);
    }

    // 定义 RestTemplate 的 Bean，给服务用
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}