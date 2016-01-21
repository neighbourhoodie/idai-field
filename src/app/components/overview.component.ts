import {Component, OnInit, Inject} from 'angular2/core';
import {Datastore} from '../services/datastore';
import {IdaiFieldObject} from '../model/idai-field-object';
import {provide} from "angular2/core";
import {IdaiFieldBackend} from '../services/idai-field-backend';
import {Utils} from '../utils';
import {MyObserver} from "../my-observer";

@Component({
    templateUrl: 'templates/overview.html'
})

/**
 * @author Sebastian Cuy
 * @author Daniel M. de Oliveira
 * @author Jan G. Wieners
 */
export class OverviewComponent implements OnInit, MyObserver {

    notify():any {
        this.fetchObjects();
    }

    public selectedObject: IdaiFieldObject;
    public objects: IdaiFieldObject[];

    constructor(
        private datastore: Datastore,
        private idaiFieldBackend: IdaiFieldBackend
    ) {

        datastore.subscribe(this);
    }

    onSelect(object: IdaiFieldObject) {
        this.selectedObject= Utils.clone(object);
    }

    getObjectIndex( id: String ) {
        for (var i in this.objects) {
            if (this.objects[i]._id==id) return i;
        }
        return null;
    }

    sync() {

        for (var o of this.objects) {

            this.idaiFieldBackend.save(o)
                .then(
                    object => {

                        object.synced = true;
                        this.datastore.update(object);
                    },
                    err => {
                    }
                );
        }
    }

    save(object: IdaiFieldObject) {

        object.synced = false;

        this.datastore.update(object).then( () => {

            Utils.deepCopy(
                object,
                this.objects[this.getObjectIndex(object._id)]
            );

        }).catch( err => { console.error(err) });

    }

    onKey(event:any) {
        if (event.target.value == "") {
            this.datastore.all({}).then(objects => {
                this.objects = objects;
            }).catch(err => console.error(err));
        } else {
            this.datastore.find(event.target.value, {}).then(objects => {
                this.objects = objects;
            }).catch(err => console.error(err));
        }
    }

    ngOnInit() {
        this.fetchObjects();
    }


    private fetchObjects() {
        this.datastore.all({}).then(objects => {
            this.objects = objects;
        }).catch(err => console.error(err));
    }
}