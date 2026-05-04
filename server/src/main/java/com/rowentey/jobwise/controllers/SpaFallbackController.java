package com.rowentey.jobwise.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaFallbackController {

    @GetMapping(value = {
        "/login",
        "/signup",
        "/api-keys",
        "/applications",
        "/applications/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
