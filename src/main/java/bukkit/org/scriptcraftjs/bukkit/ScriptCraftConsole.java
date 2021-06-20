package org.scriptcraftjs.bukkit;

import java.util.logging.Logger;

public class ScriptCraftConsole {
    private Logger logger;

    public ScriptCraftConsole(Logger logger) {
        this.logger = logger;
    }

    public void log(String text) {
        logger.warning("console: " + text);
    }
}

