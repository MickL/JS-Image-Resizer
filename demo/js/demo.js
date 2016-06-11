var Demo;
(function (Demo) {
    function showError(msg) {
        $('#resultHeadline').show().text('Error');
        $('#processTime').text('');
        $('#result').text(msg);
        $('#inputFile').val('');
    }
    Demo.showError = showError;
})(Demo || (Demo = {}));