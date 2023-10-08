/* global pm */

pm.test('expect response be 200', function () {
    pm.response.to.be.ok;
});

pm.test('expect response json contain args', function () {
    pm.expect(pm.response.json().args).to.have.property('source')
        .and.equal('newman-sample-github-collection');
});
