import fs           from "fs";
import path         from "path";
import ActionResult from "./action-result";
import HttpContext  from "./http-context";
import StatusCode   from "./status-code";
import { mymeType } from "./variables";

export default class ViewResult extends ActionResult
{
    private readonly controllerName: string;
    private readonly model:          unknown;
    private readonly statusCode:     StatusCode;
    private readonly viewName:       string;

    public constructor(httpContext: HttpContext, controllerName: string,  viewName: string, model: unknown, statusCode: StatusCode)
    {
        super(httpContext);

        this.controllerName = controllerName;
        this.model          = model;
        this.statusCode     = statusCode;
        this.viewName       = viewName;

        console.log(this.model); // Todo: Used to prevent unused error. Remove later.
    }

    public executeResult(): void
    {
        let viewpath = path.join(this.httpContext.host.root, "views", this.controllerName, `${this.viewName}.html`);

        if (!fs.existsSync(viewpath))
        {
            throw new Error(`View ${this.viewName} cannot be founded.`);
        }

        let data = fs.readFileSync(viewpath);

        this.httpContext.response.writeHead(this.statusCode, { "Content-Type": mymeType[".html"] });
        this.httpContext.response.write(data);
        this.httpContext.response.end();
    }
}