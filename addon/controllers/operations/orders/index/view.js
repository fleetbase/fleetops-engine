import Controller, { inject as controller } from '@ember/controller';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action, computed } from '@ember/object';
import { isArray } from '@ember/array';
import { not, notEmpty, alias } from '@ember/object/computed';
import {
  OSRMv1,
  Control as RoutingControl,
} from '@fleetbase/leaflet-routing-machine';
import groupBy from '@fleetbase/ember-core/utils/macros/group-by';
import refreshRoute from '@fleetbase/ember-core/utils/refresh-route';
import findClosestWaypoint from '@fleetbase/ember-core/utils/find-closest-waypoint';
import getRoutingHost from '@fleetbase/ember-core/utils/get-routing-host';
import extractCoordinates from '@fleetbase/ember-core/utils/extract-coordinates';

export default class OperationsOrdersIndexViewController extends Controller {
  /**
   * Inject the `operations.orders.index` controller
   *
   * @var {Controller}
   */
  @controller('operations.orders.index') ordersController;

  /**
   * Inject the `operations.orders.index` controller
   *
   * @var {Controller}
   */
  @controller('management.places.index') placesController;

  /**
   * Inject the `management.contacts.index` controller
   *
   * @var {Controller}
   */
  @controller('management.contacts.index') contactsController;

  /**
   * Inject the `management.vendors.index` controller
   *
   * @var {Controller}
   */
  @controller('management.vendors.index') vendorsController;

  /**
   * Inject the `management.drivers.index` controller
   *
   * @var {Controller}
   */
  @controller('management.drivers.index') driversController;

  /**
   * Inject the `modals-manager` service
   *
   * @var {Service}
   */
  @service modalsManager;

  /**
   * Inject the `notifications` service
   *
   * @var {Service}
   */
  @service notifications;

  /**
   * Inject the `currentUser` service
   *
   * @var {Service}
   */
  @service currentUser;

  /**
   * Inject the `fetch` service
   *
   * @var {Service}
   */
  @service fetch;

  /**
   * Inject the `hostRouter` service
   *
   * @var {Service}
   */
  @service hostRouter;

  @tracked isLoadingAdditionalData = false;
  @tracked isWaypointsCollapsed;
  @tracked leafletRoute;
  @tracked routeControl;

  @alias('currentUser.latitude') userLatitude;
  @alias('currentUser.longitude') userLongitude;

  @tracked detailPanelButtons = [
    {
      type: 'default',
      text: 'Edit',
      icon: 'pencil',
      iconPrefix: 'fas',
      onClick: () => {
        const order = this.model;
        this.editOrder(order);
      },
    },
  ];

  @tracked routePanelButtons = [
    {
      type: 'default',
      text: 'Edit',
      icon: 'pencil',
      iconPrefix: 'fas',
      onClick: () => {
        const order = this.model;
        this.editOrderRoute(order);
      },
    },
  ];

  @not('isWaypointsCollapsed') waypointsIsNotCollapsed;
  @notEmpty('model.payload.waypoints') isMultiDropOrder;
  @alias('ordersController.leafletMap') leafletMap;
  @groupBy('model.order_config.meta.fields', 'group') groupedMetaFields;

  /** @var entitiesByDestination */
  @computed('model.payload.{entities.[],waypoints.[]}')
  get entitiesByDestination() {
    const groups = [];

    // create groups
    this.model.payload.waypoints.forEach((waypoint) => {
      const destinationId = waypoint.id || null;

      if (destinationId) {
        const entities = this.model.payload.entities.filter(
          (entity) => entity.destination_uuid === destinationId
        );

        if (entities.length === 0) {
          return;
        }

        const group = {
          destinationId,
          waypoint,
          entities,
        };

        groups.pushObject(group);
      }
    });

    return groups;
  }

  @action resetView() {
    this.removeRoutingControlPreview();
    this.resetInterface();
  }

  @action resetInterface() {
    this.leafletMap?.liveMap?.showDrivers();
    this.leafletMap?.liveMap?.showRoutes();
  }

  @action removeRoutingControlPreview() {
    const { leafletMap, routeControl } = this;
    let removed = false;

    if (routeControl instanceof RoutingControl) {
      try {
        routeControl.remove();
        removed = true;
      } catch (e) {
        // silent
      }

      if (!removed) {
        try {
          leafletMap?.removeControl(routeControl);
        } catch (e) {
          // silent
        }
      }
    }

    if (!removed) {
      this.forceRemoveRoutePreview();
    }
  }

  @action forceRemoveRoutePreview() {
    const { leafletMap } = this;

    leafletMap.eachLayer((layer) => {
      if (layer instanceof L.Polyline || layer instanceof L.Marker) {
        layer.remove();
      }
    });
  }

  @action setupInterface() {
    // always set map layout
    this.ordersController.setLayoutMode('map');

    setTimeout(() => {
      this.leafletMap?.liveMap?.hideDrivers();
      this.leafletMap?.liveMap?.hideRoutes();

      // display order route on map
      this.displayOrderRoute();
    }, 600);
  }

  @action displayOrderRoute() {
    // map coordinates from lng, lat -> lat, lng
    const payload = this.model.payload;
    const waypoints = payload?.payloadCoordinates?.map((coord) =>
      extractCoordinates(coord)
    );
    const leafletMap = this.leafletMap;
    const routingHost = getRoutingHost(payload, payload?.waypoints?.toArray());

    if (!waypoints || waypoints.length < 2 || !leafletMap) {
      return;
    }

    // center on first coordinate
    leafletMap.stop();
    leafletMap.flyTo(waypoints.firstObject);

    const router = new OSRMv1({
      serviceUrl: `${routingHost}/route/v1`,
      profile: 'driving',
    });

    this.routeControl = new RoutingControl({
      waypoints,
      alternativeClassName: 'hidden',
      addWaypoints: false,
      router,
    }).addTo(leafletMap);

    this.routeControl?.on('routesfound', (event) => {
      const { routes } = event;

      this.leafletRoute = routes.firstObject;
    });

    setTimeout(() => {
      leafletMap?.flyToBounds(waypoints, {
        paddingBottomRight: [200, 0],
        maxZoom: 14,
        animate: true,
      });
      leafletMap.once('moveend', function () {
        leafletMap.panBy([250, 0]);
      });
    }, 300);
  }

  @action dropdownAction(actionName, dd, ...params) {
    if (typeof dd?.actions?.close === 'function') {
      dd.actions.close();
    }

    if (typeof this[actionName] === 'function') {
      this[actionName](...params);
    }
  }

  /**
   * Edit order details.
   *
   * @param {OrderModel} order
   * @param {Object} options
   * @void
   */
  @action toggleWaypointsCollapse() {
    const _isWaypointsCollapsed = this.isWaypointsCollapsed;

    this.isWaypointsCollapsed = !_isWaypointsCollapsed;
  }

  /**
   * Edit order details.
   *
   * @param {OrderModel} order
   * @param {Object} options
   * @void
   */
  @action editOrder(order, options = {}) {
    options = options === null ? {} : options;

    this.modalsManager.show('modals/order-form', {
      title: 'Edit Order Details',
      acceptButtonText: 'Save Changes',
      acceptButtonIcon: 'save',
      setOrderFacilitator: (model) => {
        order.set('facilitator', model);
        order.set('driver', null);

        if (model) {
          this.modalsManager.setOptions('driversQuery', {
            facilitator: model.id,
          });
        }
      },
      setDriver: (driver) => {
        order.set('driver_assigned', driver);

        if (!driver) {
          order.set('driver_assigned_uuid', null);
        }
      },
      scheduleOrder: (dateInstance) => {
        order.scheduled_at = dateInstance.toDate();
      },
      driversQuery: {},
      order,
      confirm: (modal) => {
        modal.startLoading();
        return order.save().then(() => {
          this.notifications.success(
            options.successNotification ||
              `'${order.public_id}' details has been updated.`
          );
        });
      },
      decline: () => {
        order.payload.rollbackAttributes();
        this.modalsManager.done();
      },
      ...options,
    });
  }

  /**
   * View order RAW order meta.
   *
   * @param {OrderModel} order
   * @void
   */
  @action viewOrderMeta(order) {
    this.modalsManager.show('modals/order-meta', {
      title: 'Order Metadata',
      acceptButtonText: 'Done',
      acceptButtonIcon: 'check',
      acceptButtonIconPrefix: 'fas',
      hideDeclineButton: true,
      order,
    });
  }

  @action unassignDriver(order, options = {}) {
    this.modalsManager.confirm({
      title: `Are you sure you wish to unassing the driver (${order.driver_assigned.name}) from this order?`,
      body: `Once the driver is unassigned, the driver will no longer have access to this orders details.`,
      order,
      confirm: (modal) => {
        modal.startLoading();

        order.setProperties({
          driver_assigned: null,
          driver_assigned_uuid: null,
        });

        return order
          .save()
          .then(() => {
            this.notifications.success(
              `Driver has been unassigned from this order.`
            );
          })
          .catch((error) => {
            this.notifications.serverError(error);
          });
      },
      ...options,
    });
  }

  /**
   * Edit order routing details.
   *
   * @param {OrderModel} order
   * @param {Object} options
   * @void
   */
  @action async editOrderRoute(order, options = {}) {
    options = options === null ? {} : options;

    await this.modalsManager.done();

    this.modalsManager.show('modals/order-route-form', {
      title: 'Edit Order Route',
      acceptButtonText: 'Save Changes',
      acceptButtonIcon: 'save',
      order,
      userLatitude: this.userLatitude,
      userLongitude: this.userLongitude,
      isOptimizingRoute: false,
      editPlace: async (place) => {
        await this.modalsManager.done();
        this.placesController.editPlace(place, {
          onFinish: () => {
            this.editOrderRoute(order);
          },
        });
      },
      toggleMultiDropOrder: () => {
        if (order.payload.isMultiDrop) {
          order.payload.waypoints.clear();
          order.payload.setProperties({
            pickup_uuid: '#',
            dropoff_uuid: '#',
          });
        } else {
          const waypoint = this.store.createRecord('waypoint');
          order.payload.waypoints.pushObject(waypoint);

          order.payload.setProperties({
            pickup_uuid: null,
            dropoff_uuid: null,
            pickup: null,
            dropoff: null,
          });
        }
      },
      removeWaypoint: (waypoint) => {
        order.payload.waypoints.removeObject(waypoint);
      },
      addWaypoint: () => {
        const waypoint = this.store.createRecord('waypoint');
        order.payload.waypoints.pushObject(waypoint);
      },
      setWaypointPlace: (index, place) => {
        if (!order.payload.waypoints?.objectAt(index)) {
          return;
        }

        order.payload.waypoints.objectAt(index).setProperties({
          name: place.name,
          place_uuid: place.id,
          place,
        });
      },
      setPayloadPlace: (prop, place) => {
        order.payload.set(prop, place);
      },
      optimizeRoute: async () => {
        this.modalsManager.setOption('isOptimizingRoute', true);

        const coordinates = order.payload.payloadCoordinates;
        const routingHost = getRoutingHost(
          order.payload,
          order.payload.waypoints
        );

        const response = await this.fetch
          .routing(
            coordinates,
            { source: 'any', destination: 'any', annotations: true },
            { host: routingHost }
          )
          .catch(() => {
            this.notifications.error(
              'Route optimization failed, check route entry and try again.'
            );
            this.modalsManager.setOption('isOptimizingRoute', false);
          });

        if (response && response.code === 'Ok') {
          if (response.waypoints && isArray(response.waypoints)) {
            const responseWaypoints =
              response.waypoints.sortBy('waypoint_index');
            const sortedWaypoints = [];

            for (let i = 0; i < responseWaypoints.length; i++) {
              const optimizedWaypoint = responseWaypoints.objectAt(i);
              const optimizedWaypointLongitude =
                optimizedWaypoint.location.firstObject;
              const optimizedWaypointLatitude =
                optimizedWaypoint.location.lastObject;
              const waypointModel = findClosestWaypoint(
                optimizedWaypointLatitude,
                optimizedWaypointLongitude,
                order.payload.waypoints
              );

              sortedWaypoints.pushObject(waypointModel);
            }

            order.payload.waypoints = sortedWaypoints;
          }
        } else {
          this.notifications.error(
            'Route optimization failed, check route entry and try again.'
          );
        }

        this.modalsManager.setOption('isOptimizingRoute', false);
      },
      confirm: (modal) => {
        modal.startLoading();

        return order.payload.save().then(() => {
          this.notifications.success(
            options.successNotification ??
              `'${order.public_id}' route details updated.`
          );
        });
      },
      decline: () => {
        order.payload.rollbackAttributes();
        this.modalsManager.done();
      },
      ...options,
    });
  }

  /**
   * Cancel the currently viewing order
   *
   * @param {OrderModel} order
   * @void
   */
  @action cancelOrder(order) {
    this.ordersController.cancelOrder(order, {
      onConfirm: () => {
        this.reloadTrackingStatuses();
      },
    });
  }

  /**
   * Delete the currently viewing order
   *
   * @param {OrderModel} order
   * @void
   */
  @action deleteOrder(order) {
    this.ordersController.deleteOrder(order, {
      onConfirm: () => {
        return this.transitionBack();
      },
    });
  }

  /**
   * Sends the order for dispatch
   *
   * @param {OrderModel} order
   * @void
   */
  @action dispatchOrder(order) {
    this.ordersController.dispatchOrder(order, {
      onConfirm: () => {
        this.reloadTrackingStatuses();
      },
    });
  }

  /**
   * Sends user to this orders socket channel
   *
   * @param {OrderModel} order
   * @void
   */
  @action listenToSocket(order) {
    this.hostRouter.transitionTo(
      'console.developers-console.sockets.watch',
      `order.${order.public_id}`
    );
  }

  /**
   * Prompt user to update order activity
   *
   * @param {OrderModel} order
   * @void
   */
  @action async createNewActivity(order) {
    this.modalsManager.displayLoader();

    const activityOptions = await this.fetch.get(
      `orders/next-activity/${order.id}`
    );
    await this.modalsManager.done();

    this.modalsManager.show(`modals/order-new-activity`, {
      title: 'Add new activity to order',
      acceptButton: false,
      selected: null,
      custom: {
        status: '',
        details: '',
        code: '',
      },
      order,
      activityOptions,
      confirm: (modal) => {
        modal.startLoading();

        let { selected, custom } = modal.getOptions(['custom', 'selected']);
        let activity = selected !== 'custom' ? activityOptions[selected] : null;

        if (selected === 'custom') {
          if (!custom.status || !custom.details || !custom.code) {
            modal.stopLoading();

            return this.notifications.warning('Invalid custom status entry.');
          }

          activity = custom;
        }

        return this.fetch
          .patch(`orders/update-activity/${order.id}`, {
            activity,
          })
          .then(() => {
            modal.stopLoading();
            refreshRoute(this);
          })
          .catch((error) => {
            modal.stopLoading();
            this.notifications.serverError(error);
          });
      },
    });
  }

  /**
   * Prompt user to assign a driver
   *
   * @param {OrderModel} order
   * @void
   */
  @action async assignDriver(order) {
    if (order.canLoadDriver) {
      this.modalsManager.displayLoader();

      order.driver = await this.store.findRecord('driver', order.driver_uuid);
      await this.modalsManager.done();
    }

    this.modalsManager.show(`modals/order-assign-driver`, {
      title: order.driver_uuid
        ? 'Change order driver'
        : 'Assign driver to order',
      acceptButtonText: 'Save Changes',
      order,
      confirm: (modal) => {
        modal.startLoading();
        return order.save().then(() => {
          this.notifications.success(
            `${order.public_id} assigned driver updated.`
          );
        });
      },
    });
  }

  /**
   * View order label
   *
   * @param {OrderModel} order
   * @void
   */
  @action async viewOrderLabel(order) {
    // render dialog to display label within
    this.modalsManager.show(`modals/order-label`, {
      title: 'Order Label',
      modalClass: 'modal-xl',
      acceptButtonText: 'Done',
      order,
    });

    // load the pdf label from base64
    // eslint-disable-next-line no-undef
    const fileReader = new FileReader();
    const pdfStream = await this.fetch
      .get(`orders/label/${order.public_id}?format=base64`)
      .then((resp) => resp.data);
    // eslint-disable-next-line no-undef
    const base64 = await fetch(`data:application/pdf;base64,${pdfStream}`);
    const blob = await base64.blob();
    // load into file reader
    fileReader.onload = (event) => {
      const data = event.target.result;
      this.modalsManager.setOption('data', data);
    };
    fileReader.readAsDataURL(blob);
  }

  /**
   * View order label
   *
   * @param {WaypointModel} waypoint
   * @void
   */
  @action async viewWaypointLabel(waypoint, dd) {
    if (dd && typeof dd.actions.close === 'function') {
      dd.actions.close();
    }

    // render dialog to display label within
    this.modalsManager.show(`modals/order-label`, {
      title: 'Waypoint Label',
      modalClass: 'modal-xl',
      acceptButtonText: 'Done',
    });

    // load the pdf label from base64
    // eslint-disable-next-line no-undef
    const fileReader = new FileReader();
    const pdfStream = await this.fetch
      .get(`orders/label/${waypoint.waypoint_public_id}?format=base64`)
      .then((resp) => resp.data);
    // eslint-disable-next-line no-undef
    const base64 = await fetch(`data:application/pdf;base64,${pdfStream}`);
    const blob = await base64.blob();
    // load into file reader
    fileReader.onload = (event) => {
      const data = event.target.result;
      this.modalsManager.setOption('data', data);
    };
    fileReader.readAsDataURL(blob);
  }

  /**
   * Reloads tracking activity for this order.
   *
   * @void
   */
  @action reloadTrackingStatuses() {
    if (!this.model.tracking_number_uuid) {
      return;
    }

    this.store
      .query('tracking-status', {
        tracking_number_uuid: this.model.tracking_number_uuid,
      })
      .then((trackingStatuses) => {
        this.model.tracking_statuses = trackingStatuses;
      });
  }

  /**
   * Uses router service to transition back to `orders.index`
   *
   * @void
   */
  @action transitionBack() {
    return this.transitionToRoute('operations.orders.index');
  }

  @action async viewCustomer({ customer, customer_is_contact }) {
    if (customer_is_contact) {
      this.contactsController.viewContact(customer);
      return;
    }

    this.vendorsController.viewVendor(customer);
  }

  @action async viewDriver(order) {
    if (order.canLoadDriver) {
      this.modalsManager.displayLoader();

      order.driver = await this.store.findRecord('driver', order.driver_uuid);
      await this.modalsManager.done();
    }

    this.driversController.viewDriver(order.driver_assigned);
  }

  @action async viewFacilitator({ facilitator, facilitator_is_contact }) {
    if (facilitator_is_contact) {
      this.contactsController.viewContact(facilitator);
      return;
    }

    this.vendorsController.viewVendor(facilitator);
  }

  @action addEntity(destination = null) {
    const entity = this.store.createRecord('entity', {
      payload_uuid: this.model.payload.id,
      destination_uuid: destination ? destination.id : null,
    });

    this.model.payload.entities.pushObject(entity);
  }

  @action removeEntity(entity) {
    entity.destroyRecord();
  }

  @action editEntity(entity) {
    this.modalsManager.show('modals/entity-form', {
      title: 'Edit Item',
      acceptButtonText: 'Save Changes',
      entity,
      uploadNewPhoto: (file) => {
        if (entity.get('isNew')) {
          const { queue } = file;
          const fileUrl = URL.createObjectURL(file.blob);

          this.modalsManager.setOption('pendingFileUpload', file);
          entity.set('photo_url', fileUrl);
          queue.remove(file);
          return;
        }

        return this.fetch.uploadFile.perform(
          file,
          {
            path: `uploads/${this.currentUser.companyId}/entities/${entity.id}`,
            key_uuid: entity.id,
            key_type: `entity`,
            type: `entity_photo`,
          },
          (uploadedFile) => {
            entity.setProperties({
              photo_uuid: uploadedFile.id,
              photo_url: uploadedFile.s3url,
              photo: uploadedFile,
            });
          }
        );
      },
      confirm: async (modal) => {
        modal.startLoading();

        const pendingFileUpload = modal.getOption('pendingFileUpload');

        return entity.save().then(() => {
          if (pendingFileUpload) {
            return modal.invoke('uploadNewPhoto', pendingFileUpload);
          }
        });
      },
    });
  }
}
