define(['jquery', 'core/ajax'], function ($, ajax) {
    return {
        analytic: function () {
            var lastAttemptSummary, loggedInUser, mixChart, allUsers, questionPerCat, timeChart, gradeAnalysis, quesAnalysis, hardestques, allQuestions, quizid, rooturl, userid, lastUserQuizAttemptID;
            var attemptssnapshot_arr = [];
            Chart.plugins.register({
                beforeDraw: function (chartInstance) {
                    var ctx = chartInstance.chart.ctx;
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
                }
            });
            $(".viewanalytic").click(function () {
                var quizid = $(this).data('quiz_id');
                var promises = ajax.call([
                    {
                        methodname: 'moodle_quizanalytics_analytic',
                        args: { quizid: quizid },
                    }
                ]);
                promises[0].done(function (data) {
                    if (data) {
                        var totalData = jQuery.parseJSON(data);
                        allQuestions = totalData.allQuestions;
                        quizid = totalData.quizid;
                        rooturl = totalData.url;
                        lastUserQuizAttemptID = totalData.lastUserQuizAttemptID;
                        $(".showanalytics").find(".parentTabs").find("span.lastattemptsummary").hide();
                        $(".showanalytics").find("#tabs-1").find("p.lastattemptsummarydes").hide();
                        $(".showanalytics").find("#tabs-1").find("p.attemptsummarydes").show();
                        if (totalData.userattempts > 1) {
                            $(".showanalytics").find(".parentTabs").find("span.lastattemptsummary").show();
                            $(".showanalytics").find("#tabs-1").find("p.lastattemptsummarydes").show();
                            $(".showanalytics").find("#tabs-1").find("p.attemptsummarydes").hide();
                        }
                        setTimeout(function () {
                            $(".showanalytics").find("ul.nav-tabs a").click(function () {
                                $(this).tab('show');
                                // Center scroll on mobile.
                                if ($(window).width() < 480) {
                                    var outerContent = $('.mobile_overflow');
                                    var innerContent = $('.canvas-wrap');
                                    if (outerContent.length > 0) {
                                        outerContent.scrollLeft((innerContent.width() - outerContent.width()) / 2);
                                    }
                                }
                            });
                        }, 100);
                        $(".showanalytics").css("display", "block");
                        if (totalData.quizattempt != 1) {
                            $("#tabs-2").find("ul").find("li").find("span.subtab1").show();
                            $("#tabs-2").find("ul").find("li").find("span.subtab2").hide();
                            $("#subtab21").find(".subtabmix").show();
                            $("#subtab21").find(".subtabtimechart").hide();
                        } else {
                            $("#tabs-2").find("ul").find("li").find("span.subtab1").hide();
                            $("#tabs-2").find("ul").find("li").find("span.subtab2").show();
                            $("#subtab21").find(".subtabmix").hide();
                            $("#subtab21").find(".subtabtimechart").show();
                        }
                        if (attemptssnapshot_arr.length > 0) {
                            $.each(attemptssnapshot_arr, function (i, v) {
                                v.destroy();
                            });
                        }
                        $('.attemptssnapshot').html('');
                        $.each(totalData.attemptssnapshot.data, function (key, value) {
                            var attemptssnapshotopt2 = {
                                tooltips: {
                                    callbacks: {
                                        // use label callback to return the desired label
                                        label: function (tooltipItem, data) {
                                            return " " + data.labels[tooltipItem.index] + " : " + data.datasets[0].data[tooltipItem.index];
                                        }
                                    }
                                },
                            };
                            var attemptssnapshotopt = $.extend(totalData.attemptssnapshot.opt[key], attemptssnapshotopt2);
                            $('.attemptssnapshot').append('<div class="span6"><label><canvas id="attemptssnapshot' + key + '"></canvas><div id="js-legend' + key + '" class="chart-legend"></div></label><div class="downloadandshare"><a class="download-canvas" data-canvas_id="attemptssnapshot' + key + '"></a><div class="shareBtn" data-user_id="' + userid + '" data-canvas_id="attemptssnapshot' + key + '"></div></div></div>');
                            var ctx = document.getElementById("attemptssnapshot" + key).getContext('2d');
                            var attemptssnapshot = new Chart(ctx, {
                                type: 'doughnut',
                                data: totalData.attemptssnapshot.data[key],
                                options: attemptssnapshotopt,
                            });
                            document.getElementById('js-legend' + key).innerHTML = attemptssnapshot.generateLegend();
                            $('#js-legend' + key).find('ul').find('li').on("click", function (snaplegende) {
                                var index = $(this).index();
                                $(this).toggleClass("strike");
                                var ci = attemptssnapshot;
                                function first(p) {
                                    for (var i in p) { return p[i] };
                                }
                                var curr = first(ci.config.data.datasets[0]._meta).data[index];
                                curr.hidden = !curr.hidden
                                ci.update();
                            });
                            attemptssnapshot_arr.push(attemptssnapshot);
                        });
                        var ctx = document.getElementById("questionpercat").getContext('2d');
                        if (questionPerCat !== undefined) {
                            questionPerCat.destroy();
                        }
                        var questionpercatopt2 = {
                            tooltips: {
                                callbacks: {
                                    // use label callback to return the desired label
                                    label: function (tooltipItem, data) {
                                        return " " + data.labels[tooltipItem.index] + " : " + data.datasets[0].data[tooltipItem.index];
                                    }
                                }
                            },
                        };
                        var questionpercatopt = $.extend(totalData.questionPerCat.opt, questionpercatopt2);
                        questionPerCat = new Chart(ctx, {
                            type: 'pie',
                            data: totalData.questionPerCat.data,
                            options: questionpercatopt,
                        });
                        document.getElementById('js-legendqpc').innerHTML = questionPerCat.generateLegend();
                        $("#js-legendqpc > ul > li").on("click", function (legende) {
                            var index = $(this).index();
                            $(this).toggleClass("strike");
                            var ci = questionPerCat;
                            function first(p) {
                                for (var i in p) { return p[i] };
                            }
                            var curr = first(ci.config.data.datasets[0]._meta).data[index];
                            curr.hidden = !curr.hidden
                            ci.update();
                        });
                        var allusersopt2 = {
                            tooltips: {
                                custom: function (tooltip) {
                                    if (!tooltip) return;
                                    // disable displaying the color box;
                                    tooltip.displayColors = false;
                                }
                            },
                            scales: { xAxes: [{ scaleLabel: { display: true, labelString: 'Hardest Categories' } }], yAxes: [{ scaleLabel: { display: true, labelString: 'Hardness in percentage (%)' }, ticks: { beginAtZero: true, max: 100, callback: function (value) { if (Number.isInteger(value)) { return value; } } } }] }
                        };
                        var allusersopt = $.extend(totalData.allUsers.opt, allusersopt2);
                        var ctx = document.getElementById("allusers").getContext('2d');
                        if (allUsers !== undefined) {
                            allUsers.destroy();
                        }
                        allUsers = new Chart(ctx, {
                            type: 'bar',
                            data: totalData.allUsers.data,
                            options: allusersopt
                        });
                        var loggedinuseropt2 = {
                            tooltips: {
                                custom: function (tooltip) {
                                    if (!tooltip) return;
                                    // disable displaying the color box;
                                    tooltip.displayColors = false;
                                }
                            },
                            scales: { xAxes: [{ scaleLabel: { display: true, labelString: 'Hardest Categories' } }], yAxes: [{ scaleLabel: { display: true, labelString: 'Hardness in percentage (%)' }, ticks: { beginAtZero: true, max: 100, callback: function (value) { if (Number.isInteger(value)) { return value; } } } }] }
                        };
                        var loggedinuseropt = $.extend(totalData.loggedInUser.opt, loggedinuseropt2);
                        var ctx = document.getElementById("loggedinuser").getContext('2d');
                        if (loggedInUser !== undefined) {
                            loggedInUser.destroy();
                        }
                        loggedInUser = new Chart(ctx, {
                            type: 'bar',
                            data: totalData.loggedInUser.data,
                            options: loggedinuseropt
                        });
                        if (totalData.lastAttemptSummary.data != 0 && totalData.lastAttemptSummary.opt != 0) {
                            $(".showanalytics").find(".noquesisattempted").hide();
                            $(".showanalytics").find("#lastattemptsummary").show();
                            var ctx = document.getElementById("lastattemptsummary");
                            ctx.height = 100;
                            var ctx1 = ctx.getContext('2d');
                            if (lastAttemptSummary !== undefined) {
                                lastAttemptSummary.destroy();
                            }
                            var lastattemptsummaryopt2 = {
                                tooltips: {
                                    custom: function (tooltip) {
                                        if (!tooltip) return;
                                        // disable displaying the color box;
                                        tooltip.displayColors = false;
                                    },
                                    callbacks: {
                                        // use label callback to return the desired label
                                        label: function (tooltipItem, data) {
                                            return tooltipItem.yLabel + " : " + tooltipItem.xLabel;
                                        },
                                        // remove title
                                        title: function (tooltipItem, data) {
                                            return;
                                        }
                                    }
                                }
                            };
                            var lastattemptsummaryopt = $.extend(totalData.lastAttemptSummary.opt, lastattemptsummaryopt2);
                            lastAttemptSummary = new Chart(ctx1, {
                                type: 'horizontalBar',
                                data: totalData.lastAttemptSummary.data,
                                options: lastattemptsummaryopt
                            });
                        } else {
                            $(".showanalytics").find("#lastattemptsummary").hide();
                            $(".showanalytics").find("#lastattemptsummary").parent().append('<p class="noquesisattempted"><b>Please attempt at least one question.</b></p>');
                        }
                        var mixchartopt2 = {
                            tooltips: {
                                custom: function (tooltip) {
                                    if (!tooltip) return;
                                    // disable displaying the color box;
                                    tooltip.displayColors = false;
                                },
                                callbacks: {
                                    // use label callback to return the desired label
                                    label: function (tooltipItem, data) {
                                        return data.datasets[tooltipItem.datasetIndex].label + " : " + tooltipItem.yLabel;
                                    },
                                    // remove title
                                    title: function (tooltipItem, data) {
                                        return;
                                    }
                                }
                            },
                            scales: { xAxes: [{ scaleLabel: { display: true, labelString: 'Number of Attempts' } }], yAxes: [{ scaleLabel: { display: true, labelString: 'Cut Off Score' }, ticks: { beginAtZero: true, callback: function (value) { if (Number.isInteger(value)) { return value; } } } }] }
                        };
                        var mixchartopt = $.extend(totalData.mixChart.opt, mixchartopt2);
                        var ctx = document.getElementById("mixchart").getContext('2d');
                        if (mixChart !== undefined) {
                            mixChart.destroy();
                        }
                        mixChart = new Chart(ctx, {
                            type: 'line',
                            data: totalData.mixChart.data,
                            options: mixchartopt
                        });
                        var timechartopt2 = {
                            tooltips: {
                                custom: function (tooltip) {
                                    if (!tooltip) return;
                                    // disable displaying the color box;
                                    tooltip.displayColors = false;
                                },
                                callbacks: {
                                    // use label callback to return the desired label
                                    label: function (tooltipItem, data) {
                                        return tooltipItem.yLabel + " : " + tooltipItem.xLabel;
                                    },
                                    // remove title
                                    title: function (tooltipItem, data) {
                                        return;
                                    }
                                }
                            },
                            scales: { xAxes: [{ scaleLabel: { display: true, labelString: 'Score' }, ticks: { beginAtZero: true, callback: function (value) { if (Number.isInteger(value)) { return value; } } } }] }
                        };
                        var timechartopt = $.extend(totalData.timeChart.opt, timechartopt2);
                        var ctx = document.getElementById("timechart").getContext('2d');
                        if (timeChart !== undefined) {
                            timeChart.destroy();
                        }
                        timeChart = new Chart(ctx, {
                            type: 'horizontalBar',
                            data: totalData.timeChart.data,
                            options: timechartopt
                        });
                        var ctx = document.getElementById("gradeanalysis").getContext('2d');
                        if (gradeAnalysis !== undefined) {
                            gradeAnalysis.destroy();
                        }
                        var gradeanalysisopt2 = {
                            tooltips: {
                                custom: function (tooltip) {
                                    if (!tooltip) return;
                                    // disable displaying the color box;
                                    tooltip.displayColors = false;
                                },
                                callbacks: {
                                    // use label callback to return the desired label
                                    label: function (tooltipItem, data) {
                                        return "Percentage Scored (" + data.labels[tooltipItem.index] + ") : " + data.datasets[0].data[tooltipItem.index];
                                    }
                                }
                            }
                        };
                        var gradeanalysisopt = $.extend(totalData.gradeAnalysis.opt, gradeanalysisopt2);
                        gradeAnalysis = new Chart(ctx, {
                            type: 'pie',
                            data: totalData.gradeAnalysis.data,
                            options: gradeanalysisopt
                        });
                        document.getElementById('js-legendgrade').innerHTML = gradeAnalysis.generateLegend();
                        $("#js-legendgrade > ul > li").on("click", function (legendgrade) {
                            var index = $(this).index();
                            $(this).toggleClass("strike");
                            var ci = gradeAnalysis;
                            function first(p) {
                                for (var i in p) { return p[i] };
                            }
                            var curr = first(ci.config.data.datasets[0]._meta).data[index];
                            curr.hidden = !curr.hidden
                            ci.update();
                        });
                        var ctx = document.getElementById("quesanalysis").getContext('2d');
                        if (quesAnalysis !== undefined) {
                            quesAnalysis.destroy();
                        }
                        var quesanalysisopt2 = {
                            tooltips: {
                                custom: function (tooltip) {
                                    if (!tooltip) return;
                                    // disable displaying the color box;
                                    tooltip.displayColors = false;
                                },
                                callbacks: {
                                    // use label callback to return the desired label
                                    label: function (tooltipItem, data) {
                                        var newtooltipq = [data.datasets[tooltipItem.datasetIndex].label + " : " + tooltipItem.yLabel, "(Click to Review Question & Last Attempt)"];
                                        return newtooltipq;
                                    }
                                }
                            },
                            scales: { xAxes: [{ scaleLabel: { display: true, labelString: 'Question Number' } }], yAxes: [{ scaleLabel: { display: true, labelString: 'Number of Attempts' }, ticks: { beginAtZero: true, callback: function (value) { if (Number.isInteger(value)) { return value; } } } }] }
                        };
                        var quesanalysisopt = $.extend(totalData.quesAnalysis.opt, quesanalysisopt2);

                        quesAnalysis = new Chart(ctx, {
                            type: 'line',
                            data: totalData.quesAnalysis.data,
                            options: quesanalysisopt
                        });
                        var hardestquesopt2 = {
                            tooltips: {
                                custom: function (tooltip) {
                                    if (!tooltip) return;
                                    // disable displaying the color box;
                                    tooltip.displayColors = false;
                                },
                                callbacks: {
                                    // use label callback to return the desired label
                                    label: function (tooltipItem, data) {
                                        var newtooltip = [data.datasets[tooltipItem.datasetIndex].label + " : " + tooltipItem.yLabel, "(Click to Review Question & Last Attempt)"];
                                        return newtooltip;
                                    },
                                    // remove title
                                    title: function (tooltipItem, data) {
                                        return;
                                    }
                                }
                            },
                            scales: { xAxes: [{ scaleLabel: { display: true, labelString: 'Hardest Questions' } }], yAxes: [{ scaleLabel: { display: true, labelString: 'Number of Attempts' }, ticks: { beginAtZero: true, callback: function (value) { if (Number.isInteger(value)) { return value; } } } }] }
                        };
                        var hardestquesopt = $.extend(totalData.hardestques.opt, hardestquesopt2);

                        var ctx = document.getElementById("hardestques").getContext('2d');
                        if (hardestques !== undefined) {
                            hardestques.destroy();
                        }
                        hardestques = new Chart(ctx, {
                            type: 'bar',
                            data: totalData.hardestques.data,
                            options: hardestquesopt
                        });
                    }
                })
                var canvasquesanalysis = document.getElementById("quesanalysis");
                var canvashardestques = document.getElementById("hardestques");
                if (canvasquesanalysis) {
                    canvasquesanalysis.onclick = function (qevt) {
                        var activePoints = quesAnalysis.getElementsAtEvent(qevt);
                        var chartData = activePoints[0]['_chart'].config.data;
                        var idx = activePoints[0]['_index'];
                        var label = chartData.labels[idx];
                        if (allQuestions !== undefined) {
                            var quesPage = 0;
                            $.each(allQuestions, function (i, quesid) {
                                if (label == quesid.split(",")[0]) {
                                    var quesid = quesid.split(",")[1];
                                    var id = quizid;
                                    if (quesPage == 0) {
                                        var newwindow = window.open(rooturl + '/mod/quiz/review.php?attempt=' + lastUserQuizAttemptID + '&showall=' + 0, '', 'height=500,width=800');
                                    } else {
                                        var newwindow = window.open(rooturl + '/mod/quiz/review.php?attempt=' + lastUserQuizAttemptID + '&page=' + quesPage, '', 'height=500,width=800');
                                    }
                                    if (window.focus) {
                                        newwindow.focus();
                                    }
                                    return false;
                                }
                                quesPage++;
                            });
                        }
                    };
                }
                if (canvashardestques) {
                    canvashardestques.onclick = function (aqevt) {
                        var activePoints = hardestques.getElementsAtEvent(aqevt);
                        var chartData = activePoints[0]['_chart'].config.data;
                        var idx = activePoints[0]['_index'];
                        var label = chartData.labels[idx];
                        if (allQuestions !== undefined) {
                            var quesPage = 0;
                            $.each(allQuestions, function (i, quesid) {
                                if (label == quesid.split(",")[0]) {
                                    var quesid = quesid.split(",")[1];
                                    var id = quizid;
                                    if (quesPage == 0) {
                                        var newwindow = window.open(rooturl + '/mod/quiz/review.php?attempt=' + lastUserQuizAttemptID + '&showall=' + 0, 'height=500,width=800');
                                    } else {
                                        var newwindow = window.open(rooturl + '/mod/quiz/review.php?attempt=' + lastUserQuizAttemptID + '&page=' + quesPage, 'height=500,width=800');
                                    }
                                    if (window.focus) {
                                        newwindow.focus();
                                    }
                                    return false;
                                }
                                quesPage++;
                            });
                        }
                    };
                }

            });
            $("#viewanalytic").one("click", function () {
                $(".showanalytics").find("canvas").each(function () {
                    var canvasid = $(this).attr("id");
                    $(this).parent().append('<div class="downloadandshare"><a class="download-canvas" data-canvas_id="' + canvasid + '"></a><div class="shareBtn" data-user_id="' + userid + '" data-canvas_id="' + canvasid + '"></div></div>');
                });
            });
            $('body').on('click', '.download-canvas', function () {
                var canvasId = $(this).data('canvas_id');
                downloadCanvas(this, canvasId, canvasId + '.jpeg');
            });
            function downloadCanvas(link, canvasId, filename) {
                link.href = document.getElementById(canvasId).toDataURL("image/jpeg");
                link.download = filename;
            }
        }
    };
});
