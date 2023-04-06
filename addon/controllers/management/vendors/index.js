import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action, get } from '@ember/object';
import { capitalize } from '@ember/string';
import apiUrl from '@fleetbase/ember-core/utils/api-url';

export default class ManagementVendorsIndexController extends Controller {
    /**
     * Inject the `operations.zones.index` controller
     *
     * @var {Controller}
     */
    @controller('operations.zones.index') zones;

    /**
     * Inject the `management.places.index` controller
     *
     * @var {Controller}
     */
    @controller('management.places.index') places;

    /**
     * Inject the `notifications` service
     *
     * @var {Service}
     */
    @service notifications;

    /**
     * Inject the `modals-manager` service
     *
     * @var {Service}
     */
    @service modalsManager;

    /**
     * Inject the `crud` service
     *
     * @var {Service}
     */
    @service crud;

    /**
     * Inject the `filters` service
     *
     * @var {Service}
     */
    @service filters;

    /**
     * Inject the `fetch` service
     *
     * @var {Service}
     */
    @service fetch;

    /**
     * Queryable parameters for this controller's model
     *
     * @var {Array}
     */
    queryParams = ['page', 'limit', 'sort', 'query', 'public_id', 'internal_id', 'created_by', 'updated_by', 'status'];

    /**
     * True if route is loading data
     *
     * @var {Boolean}
     */
    @tracked isRouteLoading;

    /**
     * The current page of data being viewed
     *
     * @var {Integer}
     */
    @tracked page = 1;

    /**
     * The maximum number of items to show per page
     *
     * @var {Integer}
     */
    @tracked limit;

    /**
     * The param to sort the data on, the param with prepended `-` is descending
     *
     * @var {String}
     */
    @tracked sort;

    /**
     * The filterable param `public_id`
     *
     * @var {String}
     */
    @tracked public_id;

    /**
     * The filterable param `internal_id`
     *
     * @var {String}
     */
    @tracked internal_id;

    /**
     * The filterable param `status`
     *
     * @var {Array}
     */
    @tracked status;

    /**
     * All possible order status options
     *
     * @var {String}
     */
    @tracked statusOptions = [];

    /**
     * All columns applicable for orders
     *
     * @var {Array}
     */
    @tracked columns = [
        {
            label: '',
            valuePath: 'selected',
            width: '40px',
            cellComponent: 'table/cell/checkbox',
            resizable: false,
            searchable: false,
            filterable: false,
            sortable: false,
        },
        {
            label: 'Name',
            valuePath: 'name',
            width: '200px',
            cellComponent: 'table/cell/media-name',
            action: this.viewVendor,
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'ID',
            valuePath: 'public_id',
            cellComponent: 'click-to-copy',
            width: '120px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Internal ID',
            valuePath: 'internal_id',
            cellComponent: 'click-to-copy',
            width: '120px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Email',
            valuePath: 'email',
            cellComponent: 'table/cell/base',
            width: '80px',
            resizable: true,
            sortable: true,
            hidden: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Phone',
            valuePath: 'phone',
            cellComponent: 'table/cell/base',
            width: '80px',
            resizable: true,
            sortable: true,
            hidden: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Address',
            valuePath: 'address_street',
            cellComponent: 'table/cell/anchor',
            action: this.viewVendorPlace,
            width: '150px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterParam: 'address',
            filterComponent: 'filter/string',
        },
        {
            label: 'Type',
            valuePath: 'type',
            cellComponent: 'table/cell/base',
            width: '140px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Country',
            valuePath: 'country',
            cellComponent: 'table/cell/base',
            cellClassNames: 'uppercase',
            width: '130px',
            resizable: true,
            sortable: true,
            hidden: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Created At',
            valuePath: 'createdAt',
            sortParam: 'created_at',
            width: '130px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/date',
        },
        {
            label: 'Updated At',
            valuePath: 'updatedAt',
            sortParam: 'updated_at',
            width: '130px',
            resizable: true,
            sortable: true,
            hidden: true,
            filterable: true,
            filterComponent: 'filter/date',
        },
        {
            label: 'Status',
            valuePath: 'status',
            cellComponent: 'table/cell/status',
            width: '130px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/multi-option',
            filterOptions: this.statusOptions,
        },
        {
            label: '',
            cellComponent: 'table/cell/dropdown',
            ddButtonText: false,
            ddButtonIcon: 'ellipsis-h',
            ddButtonIconPrefix: 'fas',
            ddMenuLabel: 'Vendor Actions',
            cellClassNames: 'overflow-visible',
            wrapperClass: 'flex items-center justify-end mx-2',
            width: '10%',
            actions: [
                {
                    label: 'View Vendor Details',
                    fn: this.viewVendor,
                },
                {
                    label: 'Edit Vendor',
                    fn: this.editVendor,
                },
                {
                    separator: true,
                },
                {
                    label: 'Delete Vendor',
                    fn: this.deleteVendor,
                },
            ],
            sortable: false,
            filterable: false,
            resizable: false,
            searchable: false,
        },
    ];

    /**
     * The search task.
     *
     * @void
     */
    @task({ restartable: true }) *search({ target: { value } }) {
        // if no query don't search
        if (isBlank(value)) {
            this.query = null;
            return;
        }

        // timeout for typing
        yield timeout(250);

        // reset page for results
        if (this.page > 1) {
            this.page = 1;
        }

        // update the query param
        this.query = value;
    }

    /**
     * Sends up a dropdown action, closes the dropdown then executes the action
     *
     * @void
     */
    @action sendDropdownAction(dd, sentAction, ...params) {
        if (typeof dd?.actions?.close === 'function') {
            dd.actions.close();
        }

        if (typeof this[sentAction] === 'function') {
            this[sentAction](...params);
        }
    }

    /**
     * Bulk deletes selected `driver` via confirm prompt
     *
     * @param {Array} selected an array of selected models
     * @void
     */
    @action bulkDeleteVendors() {
        const selected = this.table.selectedRows.map(({ content }) => content);

        this.crud.bulkDelete(selected, {
            modelNamePath: `name`,
            acceptButtonText: 'Delete Vendors',
            onConfirm: (deletedVendors) => {
                this.allToggled = false;

                deletedVendors.forEach((place) => {
                    this.table.removeRow(place);
                });

                this.target?.targetState?.router?.refresh();
            },
        });
    }

    /**
     * Toggles dialog to export `vendor`
     *
     * @void
     */
    @action exportVendors() {
        this.crud.export('vendor');
    }

    /**
     * View a `vendor` details in modal
     *
     * @param {VendorModel} vendor
     * @param {Object} options
     * @void
     */
    @action viewVendor(vendor, options) {
        const isIntegratedVendor = vendor.get('type') === 'integrated-vendor';

        this.modalsManager.show('modals/vendor-details', {
            title: vendor.name,
            titleComponent: 'modal/title-with-buttons',
            acceptButtonText: 'Done',
            args: ['vendor'],
            headerButtons: [
                {
                    icon: 'cog',
                    iconPrefix: 'fas',
                    type: 'link',
                    size: 'xs',
                    options: [
                        {
                            title: 'Edit Vendor',
                            action: () => {
                                this.modalsManager.done().then(() => {
                                    return this.editVendor(vendor, {
                                        onFinish: () => {
                                            this.viewVendor(vendor);
                                        },
                                    });
                                });
                            },
                        },
                        {
                            title: 'Delete Vendor',
                            action: () => {
                                this.modalsManager.done().then(() => {
                                    return this.deleteVendor(vendor, {
                                        onDecline: () => {
                                            this.viewVendor(vendor);
                                        },
                                    });
                                });
                            },
                        },
                    ],
                },
            ],
            isIntegratedVendor,
            vendor,
            ...options,
        });
    }

    /**
     * Create a new `vendor` in modal
     *
     * @param {Object} options
     * @void
     */
    @action async createVendor() {
        const vendor = this.store.createRecord('vendor', { status: 'active' });
        const supportedIntegratedVendors = await this.fetch.cachedGet(
            'integrated-vendors/supported',
            {},
            {
                expirationInterval: 60,
                expirationIntervalUnit: 'minutes',
            }
        );

        return this.editVendor(vendor, {
            title: 'New Vendor',
            acceptButtonText: 'Confirm & Create',
            acceptButtonIcon: 'check',
            acceptButtonIconPrefix: 'fas',
            action: 'select',
            supportedIntegratedVendors,
            selectedIntegratedVendor: null,
            integratedVendor: null,
            selectIntegratedVendor: (integratedVendor) => {
                this.modalsManager.setOption('selectedIntegratedVendor', integratedVendor);

                // create credentials object
                const credentials = {};
                for (let i = 0; i < integratedVendor.params.length; i++) {
                    const param = integratedVendor.params.objectAt(i);
                    credentials[param] = null;
                }

                const vendor = this.store.createRecord('integrated-vendor', {
                    provider: integratedVendor.code,
                    webhook_url: apiUrl(`listeners/${integratedVendor.code}`),
                    credentials,
                });

                this.modalsManager.setOption('integratedVendor', vendor);
            },
            successNotification: (vendor) => `New vendor '${vendor.name}' successfully created.`,
            onConfirm: () => {
                if (vendor.get('isNew')) {
                    return;
                }

                this.table.addRow(vendor);
            },
        });
    }

    /**
     * Edit a `vendor` details
     *
     * @param {VendorModel} vendor
     * @param {Object} options
     * @void
     */
    @action editVendor(vendor, options = {}) {
        const editVendorOptions = options;
        const isIntegratedVendor = vendor.get('type') === 'integrated-vendor';

        this.modalsManager.show('modals/vendor-form', {
            title: isIntegratedVendor ? 'Integrated Vendor Settings' : 'Edit Vendor',
            acceptButtonText: 'Save Changes',
            acceptButtonIcon: 'save',
            declineButtonIcon: 'times',
            declineButtonIconPrefix: 'fas',
            isIntegratedVendor,
            vendor,
            showAdvancedOptions: false,
            isEditingCredentials: false,
            toggleCredentialsReset: () => {
                const isEditingCredentials = this.modalsManager.getOption('isEditingCredentials');

                if (isEditingCredentials) {
                    this.modalsManager.setOption('isEditingCredentials', false);
                } else {
                    this.modalsManager.setOption('isEditingCredentials', true);
                }
            },
            toggleAdvancedOptions: () => {
                const showAdvancedOptions = this.modalsManager.getOption('showAdvancedOptions');

                if (showAdvancedOptions) {
                    this.modalsManager.setOption('showAdvancedOptions', false);
                } else {
                    this.modalsManager.setOption('showAdvancedOptions', true);
                }
            },
            editAddress: () => {
                return this.editVendorPlace(vendor, {
                    onFinish: () => {
                        this.editVendor(vendor, editVendorOptions);
                    },
                });
            },
            newAddress: () => {
                return this.createVendorPlace(vendor, {
                    onConfirm: (place) => {
                        vendor.set('place_uuid', place.id);
                        vendor.save();
                    },
                    onFinish: () => {
                        this.modalsManager.done().then(() => {
                            this.editVendor(vendor, editVendorOptions);
                        });
                    },
                });
            },
            confirm: (modal, done) => {
                modal.startLoading();

                const isAddingIntegratedVendor = modal.getOption('action') !== undefined && modal.getOption('integratedVendor')?.isNew;

                if (isAddingIntegratedVendor) {
                    const integratedVendor = modal.getOption('integratedVendor');

                    return integratedVendor
                        .save()
                        .then((integratedVendor) => {
                            this.notifications.success(`Successfully added ${capitalize(integratedVendor.provider)} new integrated vendor`);
                            this.table.addRow(integratedVendor);
                        })
                        .catch((error) => {
                            this.notifications.serverError(error, {
                                clearDuration: 600 * 6,
                            });
                        })
                        .finally(() => {
                            modal.stopLoading();
                        });
                }

                vendor
                    .save()
                    .then((vendor) => {
                        if (typeof options.successNotification === 'function') {
                            this.notifications.success(options.successNotification(vendor));
                        } else {
                            this.notifications.success(options.successNotification || `${vendor.name} details updated.`);
                        }

                        return done();
                    })
                    .catch((error) => {
                        this.notifications.serverError(error);
                    })
                    .finally(() => {
                        modal.stopLoading();
                    });
            },
            ...options,
        });
    }

    /**
     * Delete a `vendor` via confirm prompt
     *
     * @param {VendorModel} vendor
     * @param {Object} options
     * @void
     */
    @action deleteVendor(vendor, options = {}) {
        this.crud.delete(vendor, {
            acceptButtonIcon: 'trash',
            onConfirm: (vendor) => {
                if (vendor.get('isDeleted')) {
                    this.table.removeRow(vendor);
                }
            },
            ...options,
        });
    }

    /**
     * View information about the vendors place
     *
     * @param {VendorModel} vendor
     * @param {Object} options
     * @void
     */
    @action async viewVendorPlace(vendor, options = {}) {
        this.modalsManager.displayLoader();

        const place = await this.store.findRecord('place', vendor.place_uuid);

        this.modalsManager.done().then(() => {
            return this.places.viewPlace(place, options);
        });
    }

    /**
     * View information about the vendors place
     *
     * @param {VendorModel} vendor
     * @param {Object} options
     * @void
     */
    @action async editVendorPlace(vendor, options = {}) {
        this.modalsManager.displayLoader();

        const place = await this.store.findRecord('place', vendor.get('place_uuid'));
        await this.modalsManager.done({ skipCallbacks: true });

        this.modalsManager.done({ skipCallbacks: true }).then(() => {
            return this.places.editPlace(place, options);
        });
    }

    /**
     * View information about the vendors place
     *
     * @param {DriverModel} driver
     * @param {Object} options
     * @void
     */
    @action async createVendorPlace(vendor, options = {}) {
        this.modalsManager.displayLoader();
        await this.modalsManager.done();

        this.modalsManager.done().then(() => {
            return this.places.createPlace(options);
        });
    }
}
