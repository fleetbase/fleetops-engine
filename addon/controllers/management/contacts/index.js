import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action, get } from '@ember/object';
import { A, isArray } from '@ember/array';
import { timeout } from 'ember-concurrency';
import { task } from 'ember-concurrency-decorators';

export default class ManagementContactsIndexController extends Controller {
    /**
     * Inject the `operations.zones.index` controller
     *
     * @var {Controller}
     */
    @controller('operations.zones.index') zones;

    /**
     * Inject the `currentUser` service
     *
     * @var {Service}
     */
    @service store;

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
     * Inject the `fetch` service
     *
     * @var {Service}
     */
    @service fetch;

    /**
     * Inject the `filters` service
     *
     * @var {Service}
     */
    @service filters;

    /**
     * Queryable parameters for this controller's model
     *
     * @var {Array}
     */
    queryParams = ['name', 'email', 'page', 'limit', 'sort', 'query', 'public_id', 'internal_id', 'created_at', 'updated_at', 'status', 'type'];

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
     * All possible contact types
     *
     * @var {String}
     */
    @tracked contactTypes = A(['contact', 'customer']);

    /**
     * All columns applicable for orders
     *
     * @var {Array}
     */
    @tracked columns = [
        {
            label: 'Name',
            valuePath: 'name',
            width: '170px',
            cellComponent: 'table/cell/media-name',
            action: this.viewContact,
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
            width: '130px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Email',
            valuePath: 'email',
            cellComponent: 'click-to-copy',
            width: '160px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterComponent: 'filter/string',
        },
        {
            label: 'Phone',
            valuePath: 'phone',
            cellComponent: 'click-to-copy',
            width: '140px',
            resizable: true,
            sortable: true,
            filterable: true,
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
            label: 'Created At',
            valuePath: 'createdAt',
            sortParam: 'created_at',
            width: '120px',
            resizable: true,
            sortable: true,
            filterable: true,
            filterParam: 'created_at',
            filterLabel: 'Created Between',
            filterComponent: 'filter/date',
        },
        {
            label: 'Updated At',
            valuePath: 'updatedAt',
            sortParam: 'updated_at',
            width: '12%',
            resizable: true,
            sortable: true,
            hidden: true,
            filterParam: 'updated_at',
            filterLabel: 'Last Updated Between',
            filterable: true,
            filterComponent: 'filter/date',
        },
        {
            label: '',
            cellComponent: 'table/cell/dropdown',
            ddButtonText: false,
            ddButtonIcon: 'ellipsis-h',
            ddButtonIconPrefix: 'fas',
            ddMenuLabel: 'Contact Actions',
            cellClassNames: 'overflow-visible',
            wrapperClass: 'flex items-center justify-end mx-2',
            width: '10%',
            actions: [
                {
                    label: 'View Contact Details',
                    fn: this.viewContact,
                },
                {
                    label: 'Edit Contact',
                    fn: this.editContact,
                },
                {
                    separator: true,
                },
                {
                    label: 'Delete Contact',
                    fn: this.deleteContact,
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
    @action bulkDeleteContacts() {
        const selected = this.table.selectedRows.map(({ content }) => content);

        this.crud.bulkDelete(selected, {
            modelNamePath: `name`,
            acceptButtonText: 'Delete Contacts',
            onConfirm: (deletedContacts) => {
                this.allToggled = false;

                deletedContacts.forEach((place) => {
                    this.table.removeRow(place);
                });

                this.target?.targetState?.router?.refresh();
            },
        });
    }

    /**
     * Toggles dialog to export `contact`
     *
     * @void
     */
    @action exportContacts() {
        this.crud.export('contact');
    }

    /**
     * View a `contact` details in modal
     *
     * @param {ContactModel} contact
     * @param {Object} options
     * @void
     */
    @action viewContact(contact, options) {
        this.modalsManager.show('modals/contact-details', {
            title: contact.name,
            titleComponent: 'modal/title-with-buttons',
            acceptButtonText: 'Done',
            acceptButtonIcon: 'check',
            acceptButtonIconPrefix: 'fas',
            hideDeclineButton: true,
            args: ['contact'],
            headerButtons: [
                {
                    icon: 'cog',
                    iconPrefix: 'fas',
                    type: 'link',
                    size: 'xs',
                    options: [
                        {
                            title: 'Edit Contact',
                            action: () => {
                                this.modalsManager.done().then(() => {
                                    return this.editContact(contact, {
                                        onFinish: () => {
                                            this.viewContact(contact);
                                        },
                                    });
                                });
                            },
                        },
                        {
                            title: 'Delete Contact',
                            action: () => {
                                this.modalsManager.done().then(() => {
                                    return this.deleteContact(contact, {
                                        onDecline: () => {
                                            this.viewContact(contact);
                                        },
                                    });
                                });
                            },
                        },
                    ],
                },
            ],
            contact,
            ...options,
        });
    }

    /**
     * Create a new `contact` in modal
     *
     * @param {Object} options
     * @void
     */
    @action createContact() {
        const contact = this.store.createRecord('contact', {
            photo_url: `/images/no-avatar.png`,
        });

        return this.editContact(contact, {
            title: 'New Contact',
            acceptButtonText: 'Confirm & Create',
            acceptButtonIcon: 'check',
            acceptButtonIconPrefix: 'fas',
            successNotification: (contact) => `New contact (${contact.name}) created.`,
            onConfirm: () => {
                if (contact.get('isNew')) {
                    return;
                }

                this.table.addRow(contact);
            },
        });
    }

    /**
     * Edit a `contact` details
     *
     * @param {ContactModel} contact
     * @param {Object} options
     * @void
     */
    @action editContact(contact, options = {}) {
        this.modalsManager.show('modals/contact-form', {
            title: 'Edit Contact',
            acceptButtonText: 'Save Changes',
            acceptButtonIcon: 'save',
            declineButtonIcon: 'times',
            declineButtonIconPrefix: 'fas',
            contactTypes: this.contactTypes,
            contact,
            uploadNewPhoto: (file) => {
                this.fetch.uploadFile.perform(
                    file,
                    {
                        path: `uploads/${contact.company_uuid}/contacts/${contact.slug}`,
                        key_uuid: contact.id,
                        key_type: `contact`,
                        type: `contact_photo`,
                    },
                    (uploadedFile) => {
                        contact.setProperties({
                            photo_uuid: uploadedFile.id,
                            photo_url: uploadedFile.s3url,
                            photo: uploadedFile,
                        });
                    }
                );
            },
            confirm: (modal, done) => {
                modal.startLoading();

                contact
                    .save()
                    .then((contact) => {
                        if (typeof options.successNotification === 'function') {
                            this.notifications.success(options.successNotification(contact));
                        } else {
                            this.notifications.success(options.successNotification || `${contact.name} details updated.`);
                        }

                        done();
                    })
                    .catch((error) => {
                        // driver.rollbackAttributes();
                        modal.stopLoading();
                        this.notifications.serverError(error);
                    });
            },
            ...options,
        });
    }

    /**
     * Delete a `contact` via confirm prompt
     *
     * @param {ContactModel} contact
     * @param {Object} options
     * @void
     */
    @action deleteContact(contact, options = {}) {
        this.crud.delete(contact, {
            acceptButtonIcon: 'trash',
            onConfirm: (contact) => {
                if (contact.get('isDeleted')) {
                    this.table.removeRow(contact);
                }
            },
            ...options,
        });
    }
}
