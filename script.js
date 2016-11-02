var app = angular.module('stockapp', []);

app.controller(
    'AppCtrl', 
    [ 
    '$scope', 
    '$http',
    '$interval',  
    'magnitudeAsRGB', 
    'retrieveStockData',
    function ($scope, $http, $interval, magnitudeAsRGB, retrieveStockData) {
    
     //pass function from service
    $scope.RGB = magnitudeAsRGB.calculateColor

    var urlBase = 'https://crossorigin.me/http://finance.yahoo.com/d/quotes.csv?';

    $scope.symbol = 'AAPL';

    $scope.format = ['c1']
    //$scope.format = "ac1c"; //ask, bid, open

    $scope.rqURL = urlBase + "s=" + $scope.symbol + "&f=" + $scope.format;

    $scope.symbolArr = $scope.symbol.split(',')
    
    $scope.fetchStock = function(){
        $http.get($scope.rqURL).success(function(response){
                $scope.indexResult = response.split("\n");
            }).error(function(err){ console.log(err)})
    }
    $scope.fetchStock()
    //live update, refresh data every 1 second

   
    //turn off when markets closed

    $interval($scope.fetchStock,1000 )
    $scope.getData = function() {

        var promise = retrieveStockData.getTimeSeriesData($scope.symbol);

        promise.then(function(data) {
            //process data into date (x-axis label) and opening price
            parsedData = retrieveStockData.processCSV(data)
            $scope.stockDateLabels = parsedData.dates
            $scope.timeSeriesPrices = parsedData.openingPrices;
            initChart()
        });
    };
    $scope.getData();


    function initChart() {
            var ctx = $("#trends")
    var data = { 
            labels : $scope.stockDateLabels,
            datasets : [ 
                { 
                    label: "Opening Prices",
                    fill: false,
                    lineTension: 0.1,
                    backgroundColor: "rgba(75,192,192,0.4)",
                    borderColor: "rgba(75,192,192,1)",
                    borderCapStyle: 'butt',
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: 'miter',
                    pointBorderColor: "rgba(75,192,192,1)",
                    pointBackgroundColor: "#fff",
                    pointBorderWidth: 1,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: "rgba(75,192,192,1)",
                    pointHoverBorderColor: "rgba(220,220,220,1)",
                    pointHoverBorderWidth: 2,
                    pointRadius: 1,
                    pointHitRadius: 10,
                    data: $scope.timeSeriesPrices,
                    spanGaps: false,
                      //  {  },
                      // {  },
                }
            ] 
        }
    var options = { showLines: true }
         var myLineChart  = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
        })
    }
   
    

  
}])

app.service("magnitudeAsRGB", [ function() {
     return {
        calculateColor: function(item) {
            //todo check type
            change = Math.round((Math.abs(parseFloat(item)) + 1) * 50)
            var rgbString
            if (item > 0) {
                var green = Math.max(Math.min(change, 255), 0)
                return'rgb(00,'+green+',00)'
            } else {
                var red = Math.max(Math.min(change, 255), 0)
                return 'rgb('+red+',00,00)'
            }
        }
    }
}])

app.factory('retrieveStockData', function($q, $http) {
    
    buildDateQuery = function(){
        //build  date query from today to a month back
        var today = new Date()
        var day = ("0" + today.getDate()).slice(-2)
        var month = ("0" + today.getMonth()).slice(-2)
        var lastMonth = ("0" + (today.getMonth() - 1)).slice(-2)
        var year = today.getFullYear()
        //start date to end date
        queryString = '&a=' + lastMonth + '&b=' + day + '&c=' + year + '&d=' + month + '&e=' + day + '&f=' + year
        return queryString
    }
    return {
        getTimeSeriesData: function(symbol) {
            var deferred = $q.defer();
            dateQuery = buildDateQuery()
            var url = "https://crossorigin.me/http://real-chart.finance.yahoo.com/table.csv?s=" + symbol + dateQuery + "&g=d&ignore=.csv"
            $http.get(url).success(function(response) {
                // filter + format quotes here if you want

                deferred.resolve(response);
            }).error(function(err){
                alert("Sorry, there was an error retrieving stock data for "+ symbol)
            });
            return deferred.promise;
        },
        processCSV : function(csvData){
            //modulo 8 values are dates,
            //the very next value is
            //in the form Date,Open,High,Low,Close,Volume,Adj Close, NEWLINE
            var dailyData = csvData.split("\n")
            var dateList = []
            var openPriceList = []
            dailyData.forEach(function(p){
                var rowArray = p.split(',')
                dateList.push(rowArray[0])
                openPriceList.push(rowArray[1])
            })
            //remove first item of array, that is the data label
            dateList.shift()
            dateList.reverse()
            openPriceList.shift()
            openPriceList.reverse()
            return { dates: dateList, openingPrices: openPriceList }
        }
        
    };
});