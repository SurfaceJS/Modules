/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
import path                                                from "path";
import webpack                                             from "webpack";
import { removeUndefined }                                 from "./common";
import Compiler                                            from "./compiler";
import { isFile, loadModule, lookupFile, removePathAsync } from "./external";
import AnalyzerOptions                                     from "./types/analyzer-options";
import BuildOptions                                        from "./types/build-options";
import Configuration                                       from "./types/configuration";
import DevServerOptions                                    from "./types/dev-serve-options";
import Options                                             from "./types/options";

export default class Tasks
{
    private static createDefaults(): Required<Pick<Configuration, "context" | "entry" | "filename" | "output" | "tsconfig">>
    {
        return {
            context:  ".",
            entry:    "./source/index.ts",
            filename: "[name].js",
            output:   "./build",
            tsconfig: "./tsconfig.json",
        };
    }

    private static async optionsToConfiguration(options: Options & { mode?: webpack.Configuration["mode"] }): Promise<Configuration>
    {
        const cwd = process.cwd();

        const project = !options.project
            ? cwd
            : path.isAbsolute(options.project)
                ? options.project
                : path.resolve(cwd, options.project);

        const configuration: Configuration = removeUndefined
        ({
            context:       options.context,
            entry:         options.entry,
            eslintrc:      options.eslintrc,
            filename:      options.filename,
            forceTs:       options.forceTs,
            htmlTemplate:  options.htmlTemplate,
            output:        options.output,
            publicPath:    options.publicPath,
            tsconfig:      options.tsconfig,
            webpackConfig: (options.webpackConfig && Tasks.resolveModule(await loadModule(options.webpackConfig))) as webpack.Configuration | undefined,
        });

        Tasks.resolvePaths(configuration, cwd);

        const projectPath = isFile(project)
            ? project
            : lookupFile
            ([
                path.join(project, `surface.${options.mode ?? "development"}.js`),
                path.join(project, `surface.${options.mode ?? "development"}.json`),
                path.join(project, "surface.js"),
                path.join(project, "surface.json"),
            ]);

        const defaults = Tasks.createDefaults();

        if (projectPath)
        {
            Tasks.resolvePaths(defaults, path.parse(projectPath).dir);

            const projectConfiguration = Tasks.resolveModule(await loadModule(projectPath)) as Configuration;

            if (projectPath.endsWith(".json"))
            {
                Tasks.resolvePaths(projectConfiguration, path.parse(projectPath).dir);
            }

            return { ...defaults, ...projectConfiguration, ...configuration };
        }

        Tasks.resolvePaths(defaults, cwd);

        return { ...defaults, ...configuration };
    }

    private static resolveModule(module: object | { default: object }): object
    {
        if ("default" in module)
        {
            return module.default;
        }

        return module;
    }

    private static resolvePath<T extends object, TKey extends keyof T>(configuration: T, key: TKey, context: string): void
    {
        const value = configuration[key];

        if (typeof value == "string" && !path.isAbsolute(value))
        {
            configuration[key] = path.resolve(context, value) as unknown as T[TKey];
        }
    }

    private static resolvePaths(configuration: Configuration, root: string): void
    {
        if (!configuration.eslintrc)
        {
            const lookups =
            [
                path.resolve(root, ".eslintrc.js"),
                path.resolve(root, ".eslintrc.json"),
                path.resolve(root, ".eslintrc.yml"),
                path.resolve(root, ".eslintrc.yaml"),
            ];

            const eslintrcPath = lookupFile(lookups);

            if (eslintrcPath)
            {
                configuration.eslintrc = eslintrcPath;
            }
        }
        else
        {
            Tasks.resolvePath(configuration, "eslintrc", root);
        }

        Tasks.resolvePath(configuration, "context",      root);
        Tasks.resolvePath(configuration, "htmlTemplate", root);
        Tasks.resolvePath(configuration, "output",       root);
        Tasks.resolvePath(configuration, "tsconfig",     root);

        if (Array.isArray(configuration.forceTs))
        {
            configuration.forceTs.forEach((_, i, e) => Tasks.resolvePath(e, i, root));
        }
    }

    public static async analyze(options: Options & AnalyzerOptions): Promise<void>
    {
        const configuration = await Tasks.optionsToConfiguration(options);

        const analyzerOptions: AnalyzerOptions = removeUndefined
        ({
            analyzerMode:   options.analyzerMode,
            defaultSizes:   options.defaultSizes,
            exclude:        options.exclude,
            host:           options.host,
            logLevel:       options.logLevel,
            mode:           options.mode,
            open:           options.open,
            port:           options.port,
            reportFilename: options.reportFilename,
        });

        await Compiler.analyze(configuration, analyzerOptions);
    }

    public static async build(options: Options & BuildOptions): Promise<void>
    {
        const configuration = await Tasks.optionsToConfiguration(options);

        const buildOptions: BuildOptions = removeUndefined
        ({
            hot:      options.hot,
            logLevel: options.logLevel,
            mode:     options.mode,
            watch:    options.watch,
        });

        options.watch
            ? await Compiler.watch(configuration, buildOptions)
            : await Compiler.run(configuration, buildOptions);
    }

    public static async clean(options: Pick<Options, "project">): Promise<void>
    {
        const configuration = await Tasks.optionsToConfiguration(options);

        const promises =
        [
            removePathAsync(configuration.output!),
            removePathAsync(path.resolve(__dirname, ".cache")),
        ];

        await Promise.all(promises);
    }

    public static async serve(options: Options & DevServerOptions): Promise<void>
    {
        const configuration = await Tasks.optionsToConfiguration(options);

        const devServerOptions: DevServerOptions = removeUndefined
        ({
            host:     options.host,
            hot:      options.hot,
            logLevel: options.logLevel,
            port:     options.port,
        });

        await Compiler.serve(configuration, devServerOptions);
    }
}