import {Input, Output, EventEmitter, Renderer2, Component, ChangeDetectorRef} from '@angular/core';
import {ImageDocument} from 'idai-components-2';
import {LayerGroup, LayerManager} from './layer-manager';
import {MenuComponent} from '../../../widgets/menu.component';

@Component({
    selector: 'layer-menu',
    templateUrl: './layer-menu.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class LayerMenuComponent extends MenuComponent {

    @Input() layerGroups: Array<LayerGroup> = [];

    @Output() onToggleLayer = new EventEmitter<ImageDocument>();
    @Output() onFocusLayer = new EventEmitter<ImageDocument>();


    constructor(private layerManager: LayerManager,
                private changeDetectorRef: ChangeDetectorRef,
                renderer: Renderer2) {

        super(renderer, 'layer-button', 'layer-menu');
    }


    public isActiveLayer = (layer: ImageDocument) => this.layerManager.isActiveLayer(layer.resource.id);
    public toggleLayer = (layer: ImageDocument) => this.onToggleLayer.emit(layer);
    public focusLayer = (layer: ImageDocument) => this.onFocusLayer.emit(layer);


    public close() {

        super.close();
        this.changeDetectorRef.detectChanges();
    }


    public getLayerLabel(layer: ImageDocument): string {

        let label = layer.resource.shortDescription && layer.resource.shortDescription != '' ?
            layer.resource.shortDescription :
            layer.resource.identifier;

        if (label.length > 48) label = label.substring(0, 45) + '...';

        return label;
    }
}
