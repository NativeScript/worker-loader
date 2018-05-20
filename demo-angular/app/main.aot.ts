import { platformNativeScript } from "nativescript-angular/platform-static";
import { enableProdMode } from "@angular/core";
import { AppModuleNgFactory } from "./app.module.ngfactory";

enableProdMode();

platformNativeScript({ createFrameOnBootstrap: true }).bootstrapModuleFactory(AppModuleNgFactory);
