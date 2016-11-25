import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'link-modal',
    template: `
    <div class="modal-body">
        <p>Zu verknüpfende Ressource wählen:</p>
        <document-picker (documentSelected)="activeModal.close($event)"
                         [filters]="[ { field: 'type', value: 'image', invert: true } ]"></document-picker>
    </div>
    <div class="modal-footer">
        <button type="button" class="btn btn-default" (click)="c('cancel')">Abbrechen</button>
    </div>
  `
})
export class LinkModalComponent {

    constructor(public activeModal: NgbActiveModal) {}

}