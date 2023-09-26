import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

export default class VehiclePanelComponent extends Component {
    @service fetch;

    @service modalsManager;

    @service store;

    @tracked currentTab;
    @tracked devices = [];
    @tracked deviceApi = {};

    @tracked deviceSelect = ['Left back door', 'Left front door', 'Hood', 'Trunk', 'Dashboard'];
    @tracked vehicle;

    constructor() {
        super(...arguments);
        this.vehicle = this.args.vehicle;
        this.changeTab(this.args.tab || 'details');
    }

    @action async changeTab(tab) {
        this.currentTab = tab;
        if (tab === 'devices') {
            const { vehicle } = this;
            this.devices = await this.store.query('vehicle-device', { vehicle_uuid: vehicle.uuid });
        }

        if (typeof this.args.onTabChanged === 'function') {
            this.args.onTabChanged(tab);
        }
    }

    @action createDevice() {
        const { vehicle } = this;
        const device = this.store.createRecord('vehicle-device');

        this.modalsManager.show('modals/vehicle-devices-form', {
            title: 'Add Device',
            acceptButtonText: 'Save Changes',
            acceptButtonIcon: 'save',
            modalClass: 'modal-lg',
            deviceSelect: this.deviceSelect,
            device,
            setDeviceLocation: (location) => {
                device.device_location = location;
            },
            onSelectDeviceFromApi: (deviceApi) => {
                device.device_id = deviceApi.id;
                device.device_provider = 'flespi';
                device.device_type = deviceApi.device_type_id;
                device.device_name = deviceApi.name;
            },
            confirm: (modal, done) => {
                device.vehicle_uuid = vehicle.uuid;
                modal.startLoading();
                return device.save();
            },
        });
    }

    @action onOpen() {
        alert(1)
        return true;
    }
}
