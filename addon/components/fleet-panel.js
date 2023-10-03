import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class FleetPanelComponent extends Component {
    @service fetch;
    @service modalsManager;
    @service store;
    @service fetch;
    @tracked currentTab;
    @tracked fleet;

    constructor() {
        super(...arguments);
        this.fleet = this.args.fleet;
        this.changeTab(this.args.tab || 'details');
    }

    @action async changeTab(tab) {
        this.currentTab = tab;

        if (typeof this.args.onTabChanged === 'function') {
            this.args.onTabChanged(tab);
        }
    }

    @action addDriver(driver) {
        this.fetch.post('fleets/assign-driver', { driver: driver.id, fleet: this.fleet.id });
    }

    @action removeDriver(driver) {
        this.fetch.post('fleets/remove-driver', { driver: driver.id, fleet: this.fleet.id });
    }

    @action addVehicle(vehicle) {
        this.fetch.post('fleets/assign-vehicle', { vehicle: vehicle.id, fleet: this.fleet.id });
    }

    @action removeVehicle(vehicle) {
        this.fetch.post('fleets/remove-vehicle', { vehicle: vehicle.id, fleet: this.fleet.id });
    }
}
