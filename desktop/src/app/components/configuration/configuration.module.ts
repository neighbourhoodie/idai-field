import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ProjectConfigurationComponent } from './project-configuration.component';
import { WidgetsModule } from '../widgets/widgets.module';
import { ConfigurationFieldComponent } from './configuration-field.component';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule,
        WidgetsModule
    ],
    declarations: [
        ProjectConfigurationComponent,
        ConfigurationFieldComponent
    ],
    exports: [
        ProjectConfigurationComponent
    ],
    entryComponents: [
        ProjectConfigurationComponent
    ]
})

export class ConfigurationModule {}