import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class VehiclePanelComponent extends Component {
    @tracked currentTab;

    constructor() {
        super(...arguments);
        this.changeTab(this.args.tab || 'details');
    }

    @action changeTab(tab) {
        this.currentTab = tab;

        if (typeof this.args.onTabChanged === 'function') {
            this.args.onTabChanged(tab);
        }
    }
}
