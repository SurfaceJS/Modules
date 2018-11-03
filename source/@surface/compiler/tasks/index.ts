import { Indexer }                from "@surface/core";
import { coalesce }               from "@surface/core/common/generic";
import { merge }                  from "@surface/core/common/object";
import HtmlTemplatePlugin         from "@surface/html-template-plugin";
import { resolveFile }            from "@surface/io";
import SimblingResolvePlugin      from "@surface/simbling-resolve-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import fs                         from "fs";
import path                       from "path";
import rimraf                     from "rimraf";
import TerserWebpackPlugin        from "terser-webpack-plugin";
import webpack                    from "webpack";
import IConfiguration             from "../interfaces/configuration";
import { Entry }                  from "../interfaces/types";
import * as defaults              from "./defaults";
import * as enums                 from "./enums";

export async function execute(task?: enums.TasksType, config?: string, enviroment?: enums.EnviromentType, watch?: boolean, statsLevel?: webpack.Stats.Preset): Promise<void>
{
    task       = coalesce(task, enums.TasksType.build);
    config     = coalesce(config, "./");
    enviroment = coalesce(enviroment, enums.EnviromentType.development);
    watch      = coalesce(watch, false);

    const wepackconfig = getConfig(config, enviroment);

    switch (task)
    {
        case enums.TasksType.build:
        default:
            await build(wepackconfig, enviroment, watch, statsLevel);
            break;
        case enums.TasksType.clean:
            await clean(wepackconfig);
            break;
        case enums.TasksType.rebuild:
            await clean(wepackconfig);
            await build(wepackconfig, enviroment, watch, statsLevel);
            break;
    }
}

/**
 * Build Surface project using provided configuration.
 * @param config     Webpack configuration.
 * @param enviroment Enviroment variable.
 * @param watch      Enable watch mode.
 */
async function build(config: webpack.Configuration, enviroment: enums.EnviromentType, watch: boolean, statsLevel?: webpack.Stats.Preset): Promise<void>
{
    let compiler = webpack(config);

    let statOptions: webpack.Stats.ToStringOptions = statsLevel ||
    {
        assets:   true,
        errors:   true,
        colors:   true,
        version:  true,
        warnings: true
    };

    let callback: webpack.Compiler.Handler =
        (error, stats) => error ? console.log(error.message) : console.log(stats.toString(statOptions));

    console.log(`Starting ${watch ? "Watch" : "build"} using ${enviroment} configuration.`);

    if (watch)
    {
        compiler.watch({ aggregateTimeout: 500, poll: true, ignored: /node_modules/ }, callback);
    }
    else
    {
        compiler.run(callback);
    }
}

/**
 * Clean target output
 * @param config Webpack configuration
 */
async function clean(config: webpack.Configuration): Promise<void>
{
    if (config.output && config.output.path)
    {
        let outputPath = config.output.path;

        let promises =
        [
            new Promise(resolve => rimraf(outputPath, resolve)),
            new Promise(resolve => rimraf(path.resolve(__dirname, "cache-loader"), resolve))
        ];

        await Promise.all(promises);
    }
    else
    {
        throw new Error("Invalid output path.");
    }
}

/**
 * Get Webpack config based on Surface config.
 * @param path        Path to Surface config.
 * @param enviroment  Enviroment variable.
 */
function getConfig(filepath: string, enviroment: enums.EnviromentType): webpack.Configuration
{
    filepath = resolveFile(process.cwd(), [path.join(filepath, "surface.config.json")]);

    const config = require(filepath) as IConfiguration;

    const root = path.dirname(filepath);

    if (!config.context)
    {
        throw new TypeError("Property \"context\" can\"t be null");
    }

    if (!config.entry)
    {
        throw new TypeError("Property \"entry\" can\"t be null");
    }

    if (!config.output)
    {
        throw new TypeError("Property \"output\" can\"t be null");
    }

    config.context = path.resolve(root, config.context);
    config.entry   = resolveEntries(config.context, config.entry);
    config.output  = path.resolve(root, config.output);

    let userWebpack: webpack.Configuration = { };

    if (config.webpackConfig)
    {
        if (typeof config.webpackConfig == "string" && fs.existsSync(config.webpackConfig))
        {
            userWebpack = require(path.resolve(root, config.webpackConfig)) as webpack.Configuration;
        }
        else
        {
            userWebpack = config.webpackConfig as webpack.Configuration;
        }
    }

    config.tsconfig = config.tsconfig && path.resolve(root, config.tsconfig) || "tsconfig.json";
    config.tslint   = config.tslint   && path.resolve(root, config.tslint);

    defaults.loaders.ts.options.configFile = config.tsconfig;

    const resolvePlugins: Array<webpack.ResolvePlugin> = [];
    const plugins: Array<webpack.Plugin> = [];

    if (config.simblingResolve)
    {
        if (!Array.isArray(config.simblingResolve))
        {
            config.simblingResolve = [config.simblingResolve];
        }

        for (const option of config.simblingResolve)
        {
            if (option.include)
            {
                option.include = option.include.map(x => path.resolve(root, x));
            }

            if (option.exclude)
            {
                option.exclude = option.exclude.map(x => path.resolve(root, x));
            }

            resolvePlugins.push(new SimblingResolvePlugin(option));
        }
    }

    plugins.push(new webpack.WatchIgnorePlugin([/\.js$/, /\.d\.ts$/]));
    plugins.push(new ForkTsCheckerWebpackPlugin({ checkSyntacticErrors: true, tsconfig: config.tsconfig, tslint: config.tslint, watch: config.context }));

    if (config.htmlTemplate)
    {
        config.htmlTemplate.template = path.resolve(root, config.htmlTemplate.template);
        plugins.push(new HtmlTemplatePlugin(config.htmlTemplate));
    }

    const isProduction = enviroment == enums.EnviromentType.production;

    const tersePlugin = new TerserWebpackPlugin
    ({
        cache:           true,
        extractComments: true,
        parallel:        true,
        terserOptions:
        {
            compress: true,
            mangle:   true,
        }
    });

    const primaryConfig: webpack.Configuration =
    {
        context: config.context,
        devtool: isProduction ? false : "#source-map",
        entry:   config.entry,
        mode:    enums.EnviromentType.development,
        output:
        {
            path:       config.output,
            filename:   config.filename,
            publicPath: "/",
            pathinfo:   !isProduction
        },
        resolve:
        {
            modules: [config.context],
            plugins: resolvePlugins
        },
        performance:
        {
            hints: isProduction ? "warning" : false
        },
        plugins: plugins,
        optimization:
        {
            concatenateModules:   isProduction,
            flagIncludedChunks:   isProduction,
            mergeDuplicateChunks: isProduction,
            minimize:             isProduction,
            minimizer:            [tersePlugin],
            namedChunks:          !isProduction,
            namedModules:         !isProduction,
            noEmitOnErrors:       true,
            occurrenceOrder:      true,
            providedExports:      true,
            splitChunks:
            {
                cacheGroups:
                {
                    common:
                    {
                        minChunks:          2,
                        priority:           -20,
                        reuseExistingChunk: true
                    },
                    vendors:
                    {
                        test:     /[\\/]node_modules[\\/]/,
                        priority: -10
                    }
                },
                chunks:             "async",
                maxAsyncRequests:   5,
                maxInitialRequests: 3,
                maxSize:            0,
                minSize:            30000,
                minChunks:          1,
                name:               true,
            },
            usedExports: isProduction
        }
    };

    const webpackConfig = merge({ }, [defaults.webpackConfig, userWebpack, primaryConfig], true);

    return webpackConfig;
}

/**
 * Resolve entries.
 * @param entries Entries to be resolved.
 * @param context Context used to resolve entries.
 */
function resolveEntries(context: string, entries: Entry): Entry
{
    const result: Entry = { };

    if (typeof entries == "function")
    {
        entries = [entries.call(undefined)];
    }

    if (typeof entries == "string")
    {
        entries = [entries];
    }

    if (Array.isArray(entries))
    {
        const tmp: Entry = { };
        for (const entry of entries)
        {
            tmp[path.dirname(entry)] = entry;
        }

        entries = tmp;
    }

    for (const key in entries)
    {
        const value   = entries[key];
        const sources = Array.isArray(value) ? value : [value];

        for (const source of sources.map(x => x.replace(/\/\*$/, "")))
        {
            const sourcePath = path.resolve(context, source);

            if (fs.lstatSync(sourcePath).isDirectory())
            {
                for (const $module of fs.readdirSync(sourcePath))
                {
                    const modulePath = path.resolve(sourcePath, $module);
                    if (fs.existsSync(modulePath))
                    {
                        if (fs.lstatSync(modulePath).isDirectory())
                        {
                            const index = fs.readdirSync(modulePath).filter(x => x.match(/index\.[tj]s/))[0];
                            if (index)
                            {
                                result[`${key}/${$module}`] = `${source}/${$module}/${index}`;
                            }
                        }
                        else
                        {
                            result[`${source}/${path.parse($module).name}`] = `${source}/${$module}`;
                        }
                    }
                    else
                    {
                        throw new Error("Invalid path");
                    }
                }
            }
            else
            {
                setOrPush(result, key, source);
            }
        }
    }

    return result;
}

/**
 * Set or push value in a string|Array<string> value of the object.
 * @param source Target object.
 * @param key    Key of the object.
 * @param value  Value to be setted or pushed.
 */
function setOrPush(source: Indexer<string|Array<string>>, key: string, value: string): void
{
    const target = source[key];

    if (!target)
    {
        source[key] = value;
    }
    else if (!Array.isArray(target))
    {
        source[key] = [target].concat(value) as Array<string>;
    }
    else
    {
        target.push(value);
    }
}