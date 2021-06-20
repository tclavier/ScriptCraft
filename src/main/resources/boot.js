/*
  This file is the first and only file executed directly from the Java Plugin.
*/
var File = java.io.File,
    FileReader = java.io.FileReader,
    FileOutputStream = java.io.FileOutputStream,
    ZipInputStream = java.util.zip.ZipInputStream,
    //jsPlugins = new File('plugins/scriptcraft'),
    jsPlugins = new File('scriptcraft'),
    initScript = 'lib/scriptcraft.js';

function unzip(zis, logger) {
    var entry,
        reason = null,
        unzipFile = false,
        zTime = 0,
        fTime = 0,
        fout = null,
        c,
        newFile;
    console.log("Unzip start")
    while (zis.available() > 0) {
        entry = zis.getNextEntry();
        console.log("Unzip: " + entry.getName());
        newFile = new File(jsPlugins, entry.getName());
        if (entry.isDirectory()) {
            newFile.mkdirs();
            zis.closeEntry();
            continue;
        }
        reason = null;
        zTime = entry.getTime();
        unzipFile = false;
        if (!newFile.exists()) {
            reason = 'NE';
            unzipFile = true;
        } else {
            fTime = newFile.lastModified();
            if (zTime > fTime) {
                reason = (zTime - fTime) / 3600000 + 'h';
                unzipFile = true;
            }
        }
        if (unzipFile) {
            logger.info('Unzipping ' + newFile.canonicalPath + ' (' + reason + ')');
            fout = new FileOutputStream(newFile);
            for (c = zis.read(); c != -1; c = zis.read()) {
                fout.write(c);
            }
            fout.close();
        }
        zis.closeEntry();
    }
    zis.close();
    console.log("Unzip finished")
}

/*
  Called from Java plugin
*/
function __scboot(plugin, engine) {
    console.log("DEBUG: " + plugin);

    var logger = plugin.logger,
        initScriptFile = new File(jsPlugins, initScript),
        zips = ['lib', 'plugins', 'modules'],
        i = 0,
        zis,
        len = zips.length;

    if (!jsPlugins.exists()) {
        console.log('Directory ' + jsPlugins.canonicalPath + ' does not exist.');
        logger.info('Directory ' + jsPlugins.canonicalPath + ' does not exist.');
        logger.info('Initializing ' + jsPlugins.canonicalPath + ' directory with contents from plugin archive.');
        jsPlugins.mkdirs();
    }

    for (i = 0; i < len; i++) {
        if (plugin.config) {
            if (plugin.config.getBoolean('extract-js.' + zips[i])) {
                zis = new ZipInputStream(plugin.getResource(zips[i] + '.zip'));
                unzip(zis, logger);
                console.log("Extracted: " + zips[i] + ".zip");
            } else {
                console.log("Could not extract: " + zips[i]);
            }
        } else {
            console.log("Missing config attribute on: " + plugin);
        }
    }
    plugin.saveDefaultConfig();
    try {
        engine.eval(new FileReader(initScriptFile));
        __onEnable(engine, plugin, initScriptFile);
    } catch (e) {
        var msg = 'Error evaluating ' + initScriptFile + ': ' + e;
        console.log(msg);
        logger.severe(msg);
        throw e;
    }
}
