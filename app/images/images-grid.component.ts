import {Component, OnChanges, OnInit} from "@angular/core";
import {Router} from "@angular/router";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {IndexeddbDatastore} from "../datastore/indexeddb-datastore";
import {Messages} from 'idai-components-2/messages';
import {M} from "../m";
import {Query,Filter} from "idai-components-2/datastore";
import {Mediastore} from "../datastore/mediastore";
import {DomSanitizer} from '@angular/platform-browser';

@Component({
    moduleId: module.id,
    templateUrl: './images-grid.html'
})

/**
 * Displays images as a grid of tiles.
 *
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export class ImagesGridComponent implements OnChanges, OnInit {

    private query : Query = { q: '' };
    private documents;
    protected defaultFilters: Array<Filter>;

    private nrOfColumns = 4;
    private rows = [];
    private selected = [];

    public constructor(
        private router: Router,
        private datastore: IndexeddbDatastore,
        private mediastore: Mediastore,
        private sanitizer: DomSanitizer,
        private messages: Messages
    ) {
        this.defaultFilters = [ { field: 'type', value: 'image', invert: false } ];
        this.query = { q: '', filters: this.defaultFilters };
    }

    public refreshGrid() {
        this.fetchDocuments(this.query);
    }

    /**
     * Populates the document list with all documents from
     * the datastore which match a <code>query</code>
     * @param query
     */
    public fetchDocuments(query: Query) {

        this.datastore.find(query).then(documents => {

            this.documents = documents;
            var rowWidth = Math.ceil((window.innerWidth - 57) );

            // insert stub document for first cell that will act as drop area for uploading images
            this.documents.unshift({
                id: 'droparea',
                resource: { width: 1, height: 1 }
            });

            this.calcGrid(rowWidth)
            
        }).catch(err => console.error(err));
    }
    
    protected setUpDefaultFilters() {
        this.defaultFilters = [ { field: 'type', value: 'image', invert: false } ];
    }

    public ngOnInit() {
        this.fetchDocuments(this.query);
    }

    public ngOnChanges() {
        this.fetchDocuments(this.query);
    }

    public queryChanged(query: Query) {

        this.query = query;
        // this.fetchDocuments(query);
    }

    public onResize(event) {
        var rowWidth = Math.ceil((event.target.innerWidth - 57) );
        this.calcGrid(rowWidth)
    }
    
    public calcGrid(rowWidth) {

        this.rows = [];
        var nrOfRows = Math.ceil(this.documents.length / this.nrOfColumns);

        for (var rowIndex = 0; rowIndex < nrOfRows; rowIndex++) {

            var naturalRowWidth = 0;
            this.rows[rowIndex] = [];

            // generate a row of images scaled to height 1 and sum up widths
            for (var columnIndex = 0; columnIndex < this.nrOfColumns; columnIndex++) {
                var document = this.documents[rowIndex * this.nrOfColumns + columnIndex];
                if (!document) {
                    naturalRowWidth += naturalRowWidth * (this.nrOfColumns - columnIndex) / columnIndex;
                    break;
                }
                naturalRowWidth += document.resource.width / parseFloat(document.resource.height);
            }

            var calculatedHeight = rowWidth / naturalRowWidth;

            for (var columnIndex = 0; columnIndex < this.nrOfColumns; columnIndex++) {

                var document = this.documents[rowIndex * this.nrOfColumns + columnIndex];
                if (!document) break;

                var cell = {};

                cell['document'] = document;
                cell['calculatedWidth'] = document.resource.width * calculatedHeight / document.resource.height;
                cell['calculatedHeight'] = calculatedHeight;

                var callback = cell => { return url => cell['imgSrc'] = url };
                var errorCallback = cell => { return url =>
                    // display a black image
                    cell['imgSrc'] = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
                };
                if(document.resource.filename) {
                    this.urlForImage(document.resource.filename)
                        .then(callback(cell))
                        .catch(errorCallback(cell));
                }

                this.rows[rowIndex][columnIndex] = cell;
            }

        }

    }

    private urlForImage(filename): Promise<string> {
        return new Promise((resolve, reject) => {
            this.mediastore.read(filename).then(data => {
                var url = URL.createObjectURL(new Blob([data]));
                resolve(this.sanitizer.bypassSecurityTrustResourceUrl(url));
            }).catch(error => {
                this.messages.add(M.IMAGES_ERROR_MEDIASTORE_READ, [filename]);
                console.error(error);
                reject(error);
            });
        });
    }

    /**
     * @param documentToSelect the object that should be selected
     */
    public select(document: IdaiFieldDocument) {
        if (this.selected.indexOf(document) == -1) this.selected.push(document);
        else this.selected.splice(this.selected.indexOf(document), 1);
    }

    /**
     * @param documentToSelect the object that should be navigated to if the preconditions
     *   to change the selection are met.
     */
    public navigateTo(documentToSelect: IdaiFieldDocument) {
        this.router.navigate(['images', documentToSelect.resource.id, 'show']);
    }

    public clearSelection() {
        this.selected = [];
    }
}
