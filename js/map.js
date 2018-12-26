
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

  let barChart, pieChartProfes, lineChartGrad, totalInscritos, universidad, totalAdmitidos, porcentajeAdmitidos, totalMatriculados,
      docentesCatedra, docentesTCompleto, docentesTMedio, porcentajeDTC, docentes;




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
        "Este Mapa  muestra cifras de las <b>Universidades Públicas Colombianas</b>,",
         "tomando datos de Ministerio de educación, más específicamente del <a href='https://www.mineducacion.gov.co/sistemasdeinformacion/1735/w3-article-220340.html?_noredirect=1'> SNIES </a> (Sistema Nacional de información de la Educación Superior).",
         "<br>",
         "Inspeccione el mapa, utilice los bookmarks, o realice zoom para visualizar las instituciones públicas y haga click en cada una de ellas para obtener información de estudiantes y docentes",
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
      if(barChart || pieChartProfes || lineChartGrad){
        barChart.destroy();
        pieChartProfes.destroy();
        lineChartGrad.destroy();
        console.log("destruidos");

      }
      createCharts();
      event.stopPropagation();
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

                   highlight = layerview.highlight(graphic);
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
      docentesTCompleto = document.getElementById("docentesTC");
      docentesTMedio = document.getElementById("docentesMT");
      docentesCatedra = document.getElementById("docentesC");
      docentes = document.getElementById("docentes");
      porcentajeDTC = document.getElementById("porcenDocentes");



      const canvasChart = document.getElementById("pie-chart");
      barChart = new Chart(canvasChart.getContext("2d"), {
        type: "bar",
        data: {
          labels: ["Inscritos", "Admitidos",
            "Matriculados"
          ],
          datasets: [{
            label: "Estudiantes",
            backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f"],
            borderColor: "rgb(255, 255, 255)",
            borderWidth: 1,
            data: [0, 0, 0]
          }]
        },
        options: {
          responsive: true,
          legend: {
            position: "top"
          },
          title: {
            display: true,
            text: "Estadísticas de estudiantes de"+universidad+ "año 2017"
          }
        }
      });
//////////////////////////Gráfica de profesores/////////////////////////////
    const canvasChartProfes = document.getElementById("pie-chart-profes");
      pieChartProfes = new Chart(canvasChartProfes.getContext("2d"), {
        type: "pie",
        data: {
          labels: ["Tiempo Completo", "Medio Tiempo",
            "Cátedra"
          ],
          datasets: [{
            label: "Docentes (miles)",
            backgroundColor: ["#13a622", "#d1d523","#cd1010"],
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
            text: "Estadísticas de docentes de "+universidad+ "año 2017"
          }
        }
      });
      ////////////////////////////////////////////////////////////////////////////
      const canvasChartGrad = document.getElementById("line-chart");
      lineChartGrad = new Chart(canvasChartGrad.getContext("2d"), {
        type: "line",
        data: {
          labels: ["2001", "2002","2003","2004","2005","2006","2007","2008","2009","2010","2011","2012",
                    "2013","2014","2015","2016","2017"
          ],
          datasets: [{
            label: "Estudiantes Graduados(miles)",
            data: [0, 0, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
          }]
        },
        options: {
          responsive: true,
          legend: {
            position: "top"
          },
          title: {
            display: true,
            text: "Estadísticas de Graduados de "+universidad+ "(2001 - 2017)"
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
    let insc = responses.getAttribute("Inscritos");
    let admi = responses.getAttribute("Admitidos");
    let matri = responses.getAttribute("Matriculados");
    let uni = responses.getAttribute("Name");
    let docentesTC = responses.getAttribute("Docentes_TC");
    let docentesMT = responses.getAttribute("Docentes_MT");
    let docentesC = responses.getAttribute("Docentes_C");
    let g_2001 = responses.getAttribute("G_2001");
    let g_2002 = responses.getAttribute("G_2002");
    let g_2003 = responses.getAttribute("G_2003");
    let g_2004 = responses.getAttribute("G_2004");
    let g_2005 = responses.getAttribute("G_2005");
    let g_2006 = responses.getAttribute("G_2006");
    let g_2007 = responses.getAttribute("G_2007");
    let g_2008 = responses.getAttribute("G_2008");
    let g_2009 = responses.getAttribute("G_2009");
    let g_2010 = responses.getAttribute("G_2010");
    let g_2011 = responses.getAttribute("G_2011");
    let g_2012 = responses.getAttribute("G_2012");
    let g_2013 = responses.getAttribute("G_2013");
    let g_2014 = responses.getAttribute("G_2014");
    let g_2015 = responses.getAttribute("G_2015");
    let g_2016 = responses.getAttribute("G_2016");
    let g_2017 = responses.getAttribute("G_2017");

    let EstudiantesStats = [
          insc,
          admi,
          matri
    ];
    console.log(EstudiantesStats);
    let DocentesStats = [
          docentesTC,
          docentesMT,
          docentesC
    ];
    console.log("DOCENTES",DocentesStats);
    let GraduadosStats = [
      g_2001,
      g_2002,
      g_2003,
      g_2004,
      g_2005,
      g_2006,
      g_2007,
      g_2008,
      g_2009,
      g_2010,
      g_2011,
      g_2012,
      g_2013,
      g_2014,
      g_2015,
      g_2016,
      g_2017
    ];
    console.log("GRADUDADOS",GraduadosStats);
    var porcen = (admi/insc * 100);
    porcen = porcen.toFixed(3);
    let totalDocentes = docentesTC+docentesMT+docentesC;
    var porcenDoc = (docentesTC/totalDocentes* 100);
    porcenDoc = porcenDoc.toFixed(3);
    docentesMT = (docentesMT/totalDocentes*100).toFixed(3);
    docentesC = (docentesC/totalDocentes*100).toFixed(3);
    console.log(porcenDoc);
    if (insc === undefined || docentesTC === undefined){
      totalInscritos.innerHTML = '0';
      totalAdmitidos.innerHTML = '0';
      totalMatriculados.innerHTML = '0';
      universidad.innerHTML ='x';
      porcentajeAdmitidos.innerHTML = '0';
      docentesTCompleto.innerHTML ='0';
      docentesTMedio.innerHTML ='0';
      docentesCatedra.innerHTML ='0';
      docentes.innerHTML ='0';
      porcentajeDTC.innerHTML ='0';



    }else{
      totalInscritos.innerHTML = insc.toLocaleString();
      totalAdmitidos.innerHTML = admi.toLocaleString();
      totalMatriculados.innerHTML = matri.toLocaleString();
      universidad.innerHTML =uni;
      porcentajeAdmitidos.innerHTML = porcen;
      docentesTCompleto.innerHTML =docentesTC.toLocaleString();
      docentesTMedio.innerHTML =docentesMT;
      docentesCatedra.innerHTML =docentesC;
      docentes.innerHTML = totalDocentes.toLocaleString();
      porcentajeDTC.innerHTML = porcenDoc;

    }


    updateChart(barChart, EstudiantesStats, uni);
    updateChart(pieChartProfes, DocentesStats, uni);
    updateChart(lineChartGrad, GraduadosStats, uni);
    // // Update the total numbers in the title UI element


  }
//  ====================================================================================================================


    /**
     * Updates the given chart with new data
     */
    function updateChart(chart, dataValues, title) {
      console.log(chart.id);
      console.log("data",dataValues);
      chart.data.datasets[0].data = dataValues;
      console.log("universidad:",title);
      if(chart.id == 0){
      chart.options.title.text = "Estadísticas de estudiantes de la "+" "+title+" "+"año 2017";
      }else{

            chart.options.title.text = "Estadísticas de docentes de la "+" "+title+" "+"año 2017";



      }
      //chart.options.title.text = title;
      //console.log("chart", chart);
      chart.update();
    }

//  ====================================================================================================================



//  ====================================================================================================================
});
