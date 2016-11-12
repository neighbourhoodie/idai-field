import {Component, OnChanges, Input} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldResource} from "../../model/idai-field-resource";
import {ConfigLoader, ReadDatastore} from "idai-components-2/idai-components-2";
import {DocumentDetail} from "../../common/document-detail";


@Component({
    selector: 'document-view',
    moduleId: module.id,
    templateUrl: './document-view.html'
})

/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class DocumentViewComponent extends DocumentDetail implements OnChanges {

    @Input() document: any;

    constructor(
        private router: Router,
        datastore: ReadDatastore,
        configLoader: ConfigLoader
    ) {
        super(datastore,configLoader);
    }

    ngOnChanges() {

        if (!this.document) return;

        this.fields = [];
        this.relations = [];

        var resource:IdaiFieldResource = this.document.resource;

        this.initializeFields(resource);
        this.initializeRelations(resource);
    }

    public selectDocument(documentToJumpTo) {
        this.router.navigate(['resources',{ id: documentToJumpTo.resource.id }])
    }
}