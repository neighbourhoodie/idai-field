import { Component, Input } from '@angular/core';
import { Resource } from 'idai-field-core';
import { Language } from '../../../../services/languages';


@Component({
    selector: 'dai-input',
    templateUrl: './input.html'
})

/**
 * @author Thomas Kleinke
 */
export class InputComponent {

    @Input() resource: Resource;
    @Input() fieldName: string;
    @Input() languages: { [languageCode: string]: Language };


    public update(fieldData: any) {

        if (fieldData) {
            this.resource[this.fieldName] = fieldData;
        } else {
            delete this.resource[this.fieldName];
        }
    }
}
