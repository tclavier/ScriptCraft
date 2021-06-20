package org.scriptcraftjs.bukkit;

import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.plugin.java.JavaPlugin;

import javax.script.*;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Predicate;
import java.util.logging.Logger;
import java.util.zip.ZipInputStream;

public class ScriptCraftPlugin extends JavaPlugin {
    public final FileConfiguration config;
    public final Logger logger;
    public boolean bukkit = true;
    protected ScriptEngine engine = null;
    private ScriptCraftConsole console;
    // right now all ops share the same JS context/scope
    // need to look at possibly having context/scope per operator
    //protected Map<CommandSender,ScriptCraftEvaluator> playerContexts = new HashMap<CommandSender,ScriptCraftEvaluator>();
    private String NO_JAVASCRIPT_MESSAGE = "No JavaScript Engine available. ScriptCraft will not work without Javascript.";

    public ScriptCraftPlugin() {
        this.logger = this.getLogger();
        this.console = new ScriptCraftConsole(logger);
        this.config = this.getConfig();
    }

    @Override
    public void onEnable() {
        Thread currentThread = Thread.currentThread();
        ClassLoader previousClassLoader = currentThread.getContextClassLoader();
        currentThread.setContextClassLoader(getClassLoader());
        try {
            ScriptEngineManager factory = new ScriptEngineManager();
            engine = factory.getEngineByName("JavaScript");
            if (this.engine == null) {
                this.getLogger().severe(NO_JAVASCRIPT_MESSAGE);
            } else {
                Bindings bindings = this.engine.getBindings(ScriptContext.ENGINE_SCOPE);
                bindings.put("polyglot.js.allowHostAccess", true);
                bindings.put("polyglot.js.allowHostClassLookup", (Predicate<String>) s -> true);
                engine.put("console", console);
                Invocable inv = (Invocable) this.engine;
                this.engine.eval(new InputStreamReader(this.getResource("boot.js")));
                inv.invokeFunction("__scboot", this, engine);
            }
        } catch (Exception e) {
            e.printStackTrace();
            this.getLogger().severe(e.getMessage());
        } finally {
            currentThread.setContextClassLoader(previousClassLoader);
        }
    }

    public List<String> onTabComplete(CommandSender sender, Command cmd,
                                      String alias,
                                      String[] args) {
        List<String> result = new ArrayList<>();
        if (this.engine == null) {
            this.getLogger().severe(NO_JAVASCRIPT_MESSAGE);
            return null;
        }
        try {
            Invocable inv = (Invocable) this.engine;
            inv.invokeFunction("__onTabComplete", result, sender, cmd, alias, args);
        } catch (Exception e) {
            sender.sendMessage(e.getMessage());
            e.printStackTrace();
        }
        return result;
    }

    public boolean onCommand(CommandSender sender, Command cmd, String label, String[] args) {
        boolean result = false;
        Object jsResult = null;
        if (this.engine == null) {
            this.getLogger().severe(NO_JAVASCRIPT_MESSAGE);
            return false;
        }
        try {
            jsResult = ((Invocable) this.engine).invokeFunction("__onCommand", sender, cmd, label, args);
        } catch (Exception se) {
            this.getLogger().severe(se.toString());
            se.printStackTrace();
            sender.sendMessage(se.getMessage());
        }
        if (jsResult != null) {
            return ((Boolean) jsResult).booleanValue();
        }
        return result;
    }
}
