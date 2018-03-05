import {NgModule} from '@angular/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {BrowserModule} from '@angular/platform-browser';
import {MatrixComponent} from './matrix.component';
import {MatrixViewComponent} from './matrix-view.component';
import {GraphComponent} from './graph.component';

@NgModule({
    imports: [
        BrowserModule,
        NgbModule
    ],
    declarations: [
        MatrixComponent,
        MatrixViewComponent,
        GraphComponent
    ],
    providers: [
    ]
})

export class MatrixModule { }