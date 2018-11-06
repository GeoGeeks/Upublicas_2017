var dojoConfig = {
  has:{
    "esri-featurelayer-webgl": 1
  }
};

require([
  "esri/views/MapView",
  "esri/WebMap",
  "esri/widgets/Legend",
  "esri/widgets/Expand",
  "esri/widgets/Bookmarks",
  "esri/widgets/Home",
  "esri/core/lang",
  "esri/core/promiseUtils",
  "esri/core/watchUtils"
], function(
  MapView, WebMap, Legend, Expand, Bookmarks, Home,lang, promiseUtils,
  watchUtils
  ){

  let doughnutChart, totalInscritos, universidad, totalAdmitidos, porcentajeAdmitidos, totalMatriculados;
  /************************************************************
   * Creates a new WebMap instance. A WebMap must reference
   * a PortalItem ID that represents a WebMap saved to
   * arcgis.com or an on-premise portal.
   *
   * To load a WebMap from an on-premise portal, set the portal
   * url with esriConfig.portalUrl.
   ************************************************************/
  var webmap = new WebMap({
    portalItem: { // autocasts as new PortalItem()
      id: "8f5930c1e9e84c299416378afe1b39ca"
    }
  });

  /************************************************************
   * Set the WebMap instance to the map property in a MapView.
   ************************************************************/
  var view = new MapView({
    map: webmap,
    container: "viewDiv",
    constraints: {
          minScale: 30000000
    }

  });
  /* Legend Expand */
  const legendExpand = new Expand({
        view: view,
        content: new Legend({
          view: view
        }),
        //expanded: view.widthBreakpoint !== "xsmall"
  });
  view.ui.add(legendExpand, "bottom-left");

  view.watch("widthBreakpoint", function(newValue) {

        legendExpand.expanded = newValue !== "xsmall";
  });
  /************************************************************/

  /* Bookmarks */

  const bookmarksWidget = new Bookmarks({
    view: view
  });

  const bookmarksExpand = new Expand({
    view: view,
    content: bookmarksWidget
  });
  view.ui.add(bookmarksExpand, "top-right");

  bookmarksWidget.on("select-bookmark", function(event) {
  bookmarksExpand.expanded = false;
  });
  /************************************************************/

  /* Home button */

  var homeButton = new Home({
    view: view
  });
  view.ui.add(homeButton, "top-right");


  const sampleInstructions = document.createElement("div");
      sampleInstructions.style.padding = "10px";
      sampleInstructions.style.backgroundColor = "white";
      sampleInstructions.style.width = "300px";
      sampleInstructions.innerHTML = [
        "Este Mapa  muestra cifras del estudiantado en la <b>Universidad Pública Colombiana</b>,",
         "tomando datos de Ministerio de educación, más específicamente del <a href='https://www.mineducacion.gov.co/sistemasdeinformacion/1735/w3-article-220340.html?_noredirect=1'> SNIES </a> (Sistema Nacional de información de la Educación Superior).",
         "<br>",
         "Inspeccione el mapa, seleccione los <b>polígonos</b> para conocer datos del departamento.<br>",
         "Por otro lado, inspeccione cada una de las universidades públicas para tener datos de sus respectivos estudiantes",
         "<br> <br>",
         "Elaborado por: Semillero de Esri Colombia",
         "<img  src='img/geogeeks.png' alt='logo geogeeks' class='responsive'/>"

      ].join(" ");

      const instructionsExpand = new Expand({
        expandIconClass: "esri-icon-question",
        expandTooltip: "How to use this sample",
        view: view,
        content: sampleInstructions,
        expanded: view.widthBreakpoint !== "xsmall"
      });
      view.ui.add(instructionsExpand, "top-left");
//  ====================================================================================================================

  /************************************************************/
   /**
       * Create charts and start querying the layer view when
       * the view is ready and data begins to draw in the view
       */
  view.when().then(function() {
      // Create the charts when the view is ready

      console.log("capas",webmap.layers);
      const layer = webmap.layers.getItemAt(3);
      console.log("capa",layer.title);
      view.whenLayerView(layer).then(setupHoverTooltip);

      //  {
      //   watchUtils.whenFalseOnce(layerView, "updating", function(val) {
      //     // Query layer view statistics as the user clicks
      //     view.on("click", function(event) {
      //
      //       // disables navigation by pointer drag
      //       //event.stopPropagation();
      //       //console.log("EVENT",event);
      //       console.log("layerView",layerView);
      //       queryStatsOnDrag(layerView, event).then(updateCharts);
      //     });
      //
      //   });
      // });

    });
// ====================================================================================================================

  function setupHoverTooltip(layerview) {
    var promise;
    var highlight;
    var tooltipHTML;

    //var tooltip = createTooltip();
    //console.log(tooltip);

    view.on("click", function(event) {
      createCharts();
      //event.stopPropagation();
      if (promise) {
          promise.cancel();
      }
      promise = view.hitTest(event.x, event.y)
          .then(function(hit) {
              promise = null;
              if (highlight) {
                  highlight.remove();
                  highlight = null;
              }
              var results = hit.results.filter(function(result) {
                  return result.graphic.layer;
              });
              if (results.length) {
                  var graphic = results[0].graphic;
                  var screenPoint = hit.screenPoint;
                  console.log(graphic.getAttribute("Name"));
                  updateCharts(graphic);
                  // tooltipHTML = `
                  //     <p class="text-emph">${graphic.getAttribute("Inscritos")}</p>
                  //     <p>
                  //         Cobertura: <span class="text-emph">${graphic.getAttribute("Matriculados")}%</span>
                  //         <br>
                  //         Población: <span class="text-emph">${graphic.getAttribute("Name")}</span>
                  //     </p>
                  // `;
                  // highlight = layerview.highlight(graphic);
                  // tooltip.show(screenPoint, tooltipHTML);

              } else {
                  //tooltip.hide();
              }
          });
      });
  }

  /**
     * Queries statistics against the layer view at the given screen location
     */
    function queryStatsOnDrag(layerView, event) {

        const query = layerView.layer.createQuery();
        console.log(view.toMap(event));

        const allStatsResponse = layerView.queryFeatures(query)
          .then(function(response) {
            console.log("reponse",response);
            const stats = response.features[0].attributes;
            return stats;
        }, function(e) {
            console.error(e);
          });

        return promiseUtils.eachAlways([allStatsResponse]);



    }





//  ====================================================================================================================

    /* createCharts */
  function createCharts() {
      totalInscritos = document.getElementById("num-inscritos");
      universidad = document.getElementById("universidad");
      totalAdmitidos = document.getElementById("num-admitidos");
      porcentajeAdmitidos = document.getElementById("porcentaje_admitidos");
      totalMatriculados = document.getElementById("num-matriculados");
      porcentajeAdmitidos = document.getElementById("porcentaje_admitidos");

      const canvasChart = document.getElementById("pie-chart");
      doughnutChart = new Chart(canvasChart.getContext("2d"), {
        type: "doughnut",
        data: {
          labels: ["Inscritos", "Admitidos",
            "Matriculados"
          ],
          datasets: [{
            label: "Estudiantes (miles)",
            backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f"],
            borderColor: "rgb(255, 255, 255)",
            borderWidth: 1,
            data: [0, 0, 0]
          }]
        },
        options: {
          responsive: true,
          cutoutPercentage: 35,
          legend: {
            position: "top"
          },
          title: {
            display: true,
            text: "Estadísticas de estudiantes de"+universidad+ "año 2017"
          }
        }
      });
    }
//  ====================================================================================================================
/**
   * Updates the charts with the data returned from the statistic queries.
   */
  function updateCharts(responses){
    console.log("responss", responses);
    // const allStats = responses[0].value;
    // console.log("updateCharts",allStats);
    //
    var insc = responses.getAttribute("Inscritos");
    var admi = responses.getAttribute("Admitidos");
    var matri = responses.getAttribute("Matriculados");
    var uni = responses.getAttribute("Name");
    var EstudiantesStats = [
          insc,
          admi,
          matri
    ];
    console.log(EstudiantesStats);
    var porcen = (admi/insc * 100);
    porcen = porcen.toFixed(3);
    console.log(porcen);
    if (insc === undefined){
      totalInscritos.innerHTML = '0';
      totalAdmitidos.innerHTML = '0';
      totalMatriculados.innerHTML = '0';
      universidad.innerHTML ='x';
      porcentajeAdmitidos.innerHTML = '0';
    }else{
      totalInscritos.innerHTML = insc;
      totalAdmitidos.innerHTML = admi;
      totalMatriculados.innerHTML = matri;
      universidad.innerHTML =uni;
      porcentajeAdmitidos.innerHTML = porcen;

    }
    updateChart(doughnutChart, EstudiantesStats, uni);
    // // Update the total numbers in the title UI element


  }
//  ====================================================================================================================


    /**
     * Updates the given chart with new data
     */
    function updateChart(chart, dataValues, title) {
      console.log("data",dataValues);
      chart.data.datasets[0].data = dataValues;
      console.log("universidad:",title);
      chart.options.title.text = "Estadísticas de estudiantes de la "+" "+title+" "+"año 2017";
      //chart.options.title.text = title;
      //console.log("chart", chart);
      chart.update();
    }

//  ====================================================================================================================



//  ====================================================================================================================
});
