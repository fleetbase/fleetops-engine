import buildRoutes from 'ember-engines/routes';

export default buildRoutes(function () {
    this.route('operations', { path: '/' }, function () {
        this.route('dispatch');
        this.route('zones', function () { });
        this.route('service-rates', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('edit', { path: '/:public_id' });
            });
        });
        this.route('scheduler', function () { });
        this.route('orders', { path: '/' }, function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('view', { path: '/:public_id' });
                this.route('config', function () {
                    this.route('types', { path: '/' });
                });
            });
        });
    });
    this.route('management', { path: '/manage' }, function () {
        this.route('fleets', function () {
            this.route('index', { path: '/' });
        });
        this.route('vendors', function () {
            this.route('index', { path: '/' });
        });
        this.route('drivers', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new', function () {
                    this.route('details', { path: '/' }, function () {
                        this.route('new');
                        this.route('edit', { path: '/:public_id' });
                        this.route('view', { path: '/:public_id/view' });
                    });
                    this.route('tracking', function () {
                        this.route('new', { path: '/' });
                        this.route('edit', { path: '/:public_id' });
                    });
                    this.route('orders', function () {
                        this.route('new', { path: '/' });
                        this.route('edit', { path: '/:public_id' });
                    });
                });
            });
        });
        this.route('vehicles', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new', function () {
                    this.route('details', { path: '/' }, function () {
                        this.route('new');
                        this.route('edit', { path: '/:public_id' });
                        this.route('view', { path: '/:public_id/view' });
                    });
                    this.route('tracking', function () {
                        this.route('new', { path: '/' });
                        this.route('edit', { path: '/:public_id' });
                        this.route('view', { path: '/:public_id/view' });
                    });
                    this.route('telematics', function () {
                        this.route('new', { path: '/' });
                        this.route('edit', { path: '/:public_id' });
                        this.route('view', { path: '/:public_id/view' });
                    });
                });
            });
        });
        this.route('places', function () {
            this.route('index', { path: '/' });
        });
        this.route('contacts', function () {
            this.route('index', { path: '/' });
        });
        this.route('issues', function () {
            this.route('index', { path: '/' });
        });
        this.route('fuel-reports', function () {
            this.route('index', { path: '/' });
        });
        this.route('settings', function () { });
    });
    this.route('comms', function () {
        this.route('chat');
        this.route('intercom');
    });
});
