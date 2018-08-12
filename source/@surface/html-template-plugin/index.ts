import { Nullable, ObjectLiteral } from "@surface/core";
import fs                          from "fs";
import path                        from "path";
import webpack                     from "webpack";

type Entrypoint =
{
    chunks: Array<webpack.compilation.Chunk>;
    name:   string;
};

namespace HtmlTemplatePlugin
{
    export interface IOptions
    {
        filename: string;
        template: string;
    }
}

class HtmlTemplatePlugin implements webpack.Plugin
{
    private readonly filename: Nullable<string>;
    private readonly template: string;

    public constructor(options?: Partial<HtmlTemplatePlugin.IOptions>)
    {
        if (!options)
        {
            throw new Error("Parameter \"options\" can't be null.");
        }

        if (!options.template)
        {
            throw new Error("Property \"options.template\" can't be null.");
        }

        this.template = options.template;
        this.filename = options.filename;
    }

    private getModuleName(filepath: string): string
    {
        let slices = filepath.split("/").reverse();
        if (slices.length > 1 && slices[0].match(/index.[tj]s/))
        {
            return slices[1];
        }
        else
        {
            return slices[0];
        }
    }

    private templateParse(template: string, keys: ObjectLiteral<string>): string
    {
        for (let key in keys)
        {
            template = template.replace(new RegExp(`{{ *${key} *}}`, "g"), keys[key]);
        }

        return template;
    }

    private filenameParse(filename: string, keys: ObjectLiteral<string>): string
    {
        for (let key in keys)
        {
            filename = filename.replace(new RegExp(`\\[ *${key} *\\]`, "g"), keys[key]);
        }

        return filename;
    }

    public apply(compiler: webpack.Compiler)
    {
        // tslint:disable-next-line:no-this-assignment
        const self = this;
        const filename = self.filename || "[name]/index.html";

        compiler.hooks.emit.tap
        (
            HtmlTemplatePlugin.name,
            // tslint:disable-next-line:no-any
            function (compilation: webpack.compilation.Compilation)
            {
                if (!compiler.options.entry)
                {
                    throw new Error("Entry can\"t be null.");
                }

                if (!compiler.options.context)
                {
                    throw new Error("Context can\"t be null.");
                }

                for (const [key, entry] of compilation.entrypoints.entries() as IterableIterator<[string, Entrypoint]>)
                {
                    const chunk = entry.chunks
                        .filter(x => x.name == key)[0]
                        || entry.chunks[0];

                    const $module = Array.isArray(compiler.options.entry) ?
                        self.getModuleName((compiler.options.entry as Array<string>)[0]) :
                        self.getModuleName(entry.name);

                    const file = ("/" + chunk.files.filter(x => path.extname(x) == ".js")[0] || "").replace("./", "");

                    const keys =
                    {
                        file:   file,
                        hash:   compilation.hash || "",
                        module: $module,
                        name:   entry.name,
                        id:     chunk.id as string
                    };

                    let template = fs.readFileSync(path.resolve(compiler.options.context, self.template)).toString();

                    let html = self.templateParse(template, keys);

                    let asset = self.filenameParse(filename, keys);

                    compilation.assets[asset] =
                    {
                        source: () => html,
                        size:   () => html.length
                    };
                }
            }
        );
    }
}

export default HtmlTemplatePlugin;