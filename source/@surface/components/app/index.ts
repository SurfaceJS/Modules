import { element } from "@surface/custom-element/decorators";
import Component   from "..";
import template    from "./index.html";
import style       from "./index.scss";

@element("surface-app", template, style)
export default class App extends Component
{ }