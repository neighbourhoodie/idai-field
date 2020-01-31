import {Component, Input} from '@angular/core';
import {FieldDocument} from 'idai-components-2';
import {TypeUtility} from '../../../../core/model/type-utility';
import {RoutingService} from '../../../routing-service';
import {ResourcesComponent} from '../../resources.component';
import {ViewFacade} from '../../../../core/resources/view/view-facade';
import {NavigationService} from '../../../../core/resources/navigation/navigation-service';


@Component({
    selector: 'sidebar-list-button-group',
    moduleId: module.id,
    templateUrl: './sidebar-list-button-group.html'
})
/**
 * @author Daniel de Oliveira
 */
export class SidebarListButtonGroupComponent {

    @Input() document: FieldDocument;

    constructor(private resourcesComponent: ResourcesComponent,
                public viewFacade: ViewFacade,
                public typeUtility: TypeUtility,
                private routingService: RoutingService,
                private navigationService: NavigationService) {
    }


    public shouldShowArrowUpForSearchMode = () => this.navigationService.shouldShowArrowUpForSearchMode(this.document);

    public shouldShowArrowTopRight = () => this.navigationService.shouldShowArrowTopRight(this.document);

    public shouldShowArrowTopRightForSearchMode = () => this.navigationService.shouldShowArrowTopRightForSearchMode(this.document);

    public jumpToResourceInSameView = () => this.navigationService.jumpToResourceInSameView(this.document);

    public shouldShowArrowBottomRight = () => this.navigationService.shouldShowArrowBottomRight(this.document);

    public jumpToView = () => this.navigationService.jumpToView(this.document);


    public async jumpToResourceFromOverviewToOperation() {

        this.resourcesComponent.closePopover();
        await this.navigationService.jumpToResourceFromOverviewToOperation(this.document);
        this.resourcesComponent.setScrollTarget(this.document);
    }
}