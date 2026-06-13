package com.sss.loan;

import javax.swing.UIManager;
import javax.swing.plaf.ColorUIResource;
import java.awt.Color;
import java.awt.Font;

/**
 * Handles custom UI styling for JOptionPane dialogs.
 * Demonstrates retaining the SSS design.
 */
public class UITheme {

    // SSS Brand Colors
    private static final Color SSS_NAVY = new Color(0, 56, 168);
    private static final Color SSS_GOLD = new Color(255, 204, 0);
    private static final Color BG_COLOR = new Color(245, 247, 250);

    /**
     * Applies custom UIManager properties to override default Swing Look and Feel.
     */
    public static void applySSSTheme() {
        try {
            // Apply a modern font
            Font mainFont = new Font("Arial", Font.PLAIN, 14);
            Font boldFont = new Font("Arial", Font.BOLD, 14);

            UIManager.put("OptionPane.background", new ColorUIResource(BG_COLOR));
            UIManager.put("Panel.background", new ColorUIResource(BG_COLOR));
            
            UIManager.put("OptionPane.messageFont", mainFont);
            UIManager.put("OptionPane.buttonFont", boldFont);
            
            // Customize buttons
            UIManager.put("Button.background", new ColorUIResource(SSS_NAVY));
            UIManager.put("Button.foreground", new ColorUIResource(Color.WHITE));
            
            // Customize text fields
            UIManager.put("TextField.font", mainFont);
            UIManager.put("TextField.foreground", new ColorUIResource(SSS_NAVY));
            
            // Customize labels
            UIManager.put("Label.font", mainFont);
            UIManager.put("Label.foreground", new ColorUIResource(Color.DARK_GRAY));
            
        } catch (Exception e) {
            // Fallback to default if styling fails
            System.err.println("Could not apply SSS theme: " + e.getMessage());
        }
    }
}
