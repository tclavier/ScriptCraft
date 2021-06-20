/*
  This file is the first and only file executed directly from the Java Plugin.
*/
const File = java.io.File;
const FileReader = java.io.FileReader;
const FileOutputStream = java.io.FileOutputStream;
const ZipInputStream = java.util.zip.ZipInputStream;
//jsPlugins = new File('plugins/scriptcraft'),
const jsPlugins = new File('scriptcraft');

function unzip(zis, logger) {
    var entry,
        reason = null,
        unzipFile = false,
        zTime = 0,
        fTime = 0,
        fout = null,
        newFile;
    while ((entry = zis.getNextEntry()) !== null) {
        newFile = new File(jsPlugins, entry.getName());
        if (entry.isDirectory()) {
            newFile.mkdirs();
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
            logger.info('Unzipping ' + newFile.getCanonicalPath() + ' (' + reason + ')');
            fout = new FileOutputStream(newFile);
            while (zis.available() > 0) {
                let c = zis.read();
                fout.write(c);
            }
            fout.close();
        }
    }
    zis.close();
}

/*
  Called from Java plugin
*/
function __scboot(plugin, engine) {
    let logger = plugin.logger;
    let zips = ['lib', 'plugins', 'modules'];
    let i = 0;
    let zis;
    let len = zips.length;

    if (!jsPlugins.exists()) {
        logger.info('Directory ' + jsPlugins.canonicalPath + ' does not exist.');
        logger.info('Initializing ' + jsPlugins.canonicalPath + ' directory with contents from plugin archive.');
        jsPlugins.mkdirs();
    }

    for (i = 0; i < len; i++) {
        if (plugin.config) {
            if (plugin.config.getBoolean('extract-js.' + zips[i])) {
                zis = new ZipInputStream(plugin.getResource(zips[i] + '.zip'));
                unzip(zis, logger);
            } else {
                logger.severe("Could not extract: " + zips[i]);
            }
        } else {
            logger.severe("Missing config attribute on: " + plugin);
        }
    }
    plugin.saveDefaultConfig();
    const initScript = 'lib/scriptcraft.js';
    let initScriptFile = new File(jsPlugins, initScript);
    try {
        engine.eval(new FileReader(initScriptFile));
        __onEnable(engine, plugin, initScriptFile);
    } catch (e) {
        const msg = 'Error evaluating ' + initScriptFile + ': ' + e.getMessage();
        logger.severe(msg);
        throw e;
    }
}
