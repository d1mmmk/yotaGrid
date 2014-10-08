(function( $, window, undefined ){
    'use strict';

    var utils = {};

    utils.observer = function(){
        this._fns = [];
    };
    utils.observer.prototype = {
        subscribe: function( fn ){
            return typeof fn === 'function' && this._fns.push( fn );
        },
        fire: function( data ){
            for (var i = this._fns.length - 1; i >= 0; i--) {
                this._fns[i]( data );
            }
        }
    };

    utils.tmpl = function( tmpl, data ){
        if( typeof tmpl === 'function') {
            return tmpl( data ); 
        }
        for( var key in data ){
            if ( data.hasOwnProperty( key ) ){
                tmpl = tmpl.replace(new RegExp("\\$\\{"+key+"\\}","gi"), data[ key ]);
            }
        }
        return tmpl;
    };

    function JGrid( element, options ){
        this.init( element, options );
        return this.api;
    }

    JGrid.prototype = {
        init: function( element, options ){
            this.element = element;
            this.view  = options.view;
            this.onChange  = options.view.onChange();

            this.subscribe();
            this.render();
            return this.initApi();
        },
        render: function(){
            var render;
            if ( typeof this.view.render === 'function' ){
                render =  this.view.render();
            }
            this.element.innerHTML = render;
            return render;
        },
        subscribe: function(){
            var self = this;
            this.onChange.subscribe( function(){
                return self.render();
            });
        },
        initApi: function(){
            var self = this;
            this.api = {
                render: function(){
                    return self.render( arguments );
                },
            };
            return this;
        }
    };

    $.fn.jGrid = function( options ){
        $( this ).each( function(){
            var el = this,
                data = $( el ).data( 'jGrid');
            if ( typeof data == 'undefined' ){
                $( el ).data( 'jGrid' , data = new JGrid( el, options ) );
            }
            return data;
        });
        return $( this );
    };

    var Model = window.Model = function( data ){
        this.init( data );
        return this.api;
    };

    Model.prototype = {
        init: function( data ){
            this.data = [];
            this.addData( data );

            this.collectDataTimer = null;
            this.collectDataArray = [];

            this.onChange = new utils.observer();

            return this.initApi();
        },
        addData: function( data, callback ){
            for ( var i = 0 ; i <= data.length - 1; i++ ) {
                this.addDataRow( data[i] );
            }
            return this.updateIndex( callback );
        },
        addDataRow: function( data ){
            var val = {};
            switch ( typeof data ){
                case 'string':
                    val = {
                        title: '',
                        data: data
                    };
                    break;
                default:
                    val = {
                        title: data.hasOwnProperty( 'title' )? data.title : '',
                        data : data.hasOwnProperty( 'data' )? data.data: ''
                    };
            }
            return this.data.push( val );
        },
        collectData: function( data ){
            
            var self = this;
            clearTimeout( this.collectDataTimer );

            if ( arguments.length > 1 ){
                data = { data:  Array.prototype.slice.call( arguments ).split( ', ' ) }; 
            } else if ( typeof data === 'string' ) {
                data = [ data ];
            }
            this.collectDataArray.push( data );

            this.collectDataTimer = setTimeout( function(){ 
                var dataArray = self.collectDataArray.slice( 0 );

                self.collectDataArray = [];
                self.addData( dataArray, function(){
                    self.onChange.fire( self.data );
                } );
            }, 1 );
        },
        updateIndex: function( callback ){
            for (var i = this.data.length - 1; i >= 0; i--) {
                this.data[i].id = i;
            }
            return typeof callback === 'function' && callback();
        },
        initApi: function(){
            var self = this;
            this.api = {
                add: function( data ){
                    return self.collectData( data );
                },
                getData: function(){
                    return self.data;
                },
                onChange: function(){
                    return self.onChange;
                }
            };
        }
    };

    var View = window.View = function( model ){
        this.init( model );
        return this.api;
    };

    View.prototype = {
        init: function( model ){
            this.model = model;
            this.data = this.model.getData();

            this.onDataChange = this.model.onChange();

            this.onChange = new utils.observer();

            this.colNames = [ 'id', 'Title', 'Data' ];

            this.preRender();
            this.subscribe();
            return this.initApi();
        },
        preRender: function(){
            var row = '';
            for (var i = 0; i <= this.colNames.length - 1; i++) {
                row += '<th>' + this.colNames[i] + '</th>';
                // row += utils.tmpl( '<th>${name}</th>', { name: this.colNames[i] } );
            }
            row = '<tr>' + row + '</tr>';
            this.tHead = '<thead>' + row + '</thead>';
            this.tFooter = '<tfoot>' + row + '</tfoot>';
        },
        renderRow: function( data ){
            return '<tr><td>' +data.id +'</td><td>' + data.title + '</td><td>' + data.data + '</td></tr>';
            //return utils.tmpl( '<tr><td>${id}</td><td>${title}</td><td>${data}</td></tr>', data ); //на самом деле регекспы сосут, проигрыш в скорости 1000%
        },
        render: function( params ){
            var render = '';

            if ( !this.data ) { return 'empty data'; }
            var time = this.data.length + ' rows';
            console.time( time );
            for (var i = 0 ; i <= this.data.length - 1; i ++) {
                render += this.renderRow( this.data[i] );
            }
            render = '<tboby>' + render + '</tboby>';

            console.timeEnd( time );
            return '<table>' + this.tHead + this.tFooter + render + '</table>';
        },
        onChange: function( data ){
            this.data = data;
        },
        subscribe: function(){
            var self = this;
            this.onDataChange.subscribe( function( data ){
                self.onChange.fire( data );
            });
        },
        initApi: function(){
            var self = this;
            this.api = {
                render: function(){
                    return self.render( arguments );
                },
                onChange: function(){
                    return self.onChange;
                }
            };
        }
    };


})( jQuery, window );
