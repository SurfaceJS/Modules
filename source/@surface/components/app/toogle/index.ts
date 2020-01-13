import { element } from "@surface/custom-element/decorators";
import Component   from "../..";
import template    from "./index.html";
import style       from "./index.scss";

@element("surface-app-toogle", template, style)
export default class AppToogle extends Component
{ }