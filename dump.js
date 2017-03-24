                        if (output.ScheduleState.includes("Backlog") === true) {
                            cssResult = 'Backlog';
                            console.log(' CSS b',cssResult);
                        }
                        if (output.ScheduleState.includes("Defined") === true) {
                            cssResult = 'Defined';
                            console.log(' CSS d',cssResult);
                        }
                        if (output.ScheduleState.includes("In-Progress") === true) {
                            cssResult = 'In-Progress';
                            console.log(' CSS p',cssResult);
                        }
                        if (output.ScheduleState.includes("Completed") === true) {
                            cssResult = 'Completed';
                            console.log(' CSS c',cssResult);
                        }
                        if (output.ScheduleState.includes("Accepted") === true) {
                            cssResult = 'Accepted';
                            console.log(' CSS a',cssResult);
                        }
                        if (output.ScheduleState.includes("Live") === true) {
                            cssResult = 'Live';
                            console.log(' CSS l',cssResult);
                        }