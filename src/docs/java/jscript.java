import javax.script.*;
import java.io.FileReader;
import java.util.List;
import java.util.function.Predicate;

public class jscript {
    public static void main(String[] args) throws Exception {
        ScriptEngineManager factory = new ScriptEngineManager();
        ScriptEngine engine = factory.getEngineByName("JavaScript");
        java.io.File file = new java.io.File(args[0]);
        engine.put("engine", engine);
        engine.put("args", args);
        engine.put("cmItemTypeClass", Class.forName("net.canarymod.api.inventroy.ItemType"));
        Bindings bindings = engine.getBindings(ScriptContext.ENGINE_SCOPE);
        bindings.put("polyglot.js.allowHostAccess", true);
        bindings.put("polyglot.js.allowHostClassLookup", (Predicate<String>) s -> true);
        FileReader fr = new java.io.FileReader(file);
        engine.eval(fr);
        fr.close();
    }
}
