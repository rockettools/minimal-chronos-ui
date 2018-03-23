import _ from 'lodash';
import React from 'react';

export default class extends React.Component {

  async componentDidMount() {
    const result = await fetch('/job');
    const jobs = (await result.json()).items;
    this.setState({
      jobs
    })

    if (window.location.hash && window.location.hash.length>1) {
      const hash = window.location.hash.substr(1);
      console.log("Looking for: "+hash)
      const job = _.filter(jobs, job => job.name === hash)[0];
      if (job) {
        this.setState({
          job
        });
      }
    }
  }

  openJob(job) {
    job.environmentVariables = job.environmentVariables.sort((a,b)=>a.name.localeCompare(b.name));
    window.location.hash = '#'+encodeURIComponent(job.name)
    this.setState({
      job
    });
  }

  removeEnvVar(envVar) {
    const job = this.state.job;
    job.environmentVariables = _.filter(job.environmentVariables, a=> a.name!== envVar.name);
    this.setState({job});
  }

  updateField(path, value) {
    const job = this.state.job;
    _.set(job, path, value);
    this.setState({job});
  }

  makeInputField(fieldName, path) {
    const that = this;
    return <div className={'form-group'}>{fieldName}: <input onChange={function(evt){that.updateField(path, evt.target.value)}} type='text' value={_.get(this.state.job, path)} /></div>
  }

  makeCheckbox(fieldName, path) {
   const that = this;
    return <div className={'form-group'}>{fieldName}: <input type='checkbox' onChange={function(evt){that.updateField(path, evt.target.checked)}} checked={_.get(this.state.job, path)} /></div>    
  }

  updateDuplicateName(evt) {
    this.setState({
      duplicateName: evt.target.value
    })
  }

  saveJob(job) {
    const result = fetch('/job', {
      body: JSON.stringify(job),
      headers: {
        'content-type': 'application/json'
      },
      method: 'POST'
    });

    console.log(result);
  }

  duplicate() {
    console.log('d');
    const job = _.cloneDeep(this.state.job);
    job.name = this.state.duplicateName;
    console.log(job);
    this.saveJob(job);
  }

  render() {
    const that = this;

    const job = _.get(this, 'state.job') ? (<div style={{width: '100%'}}>

        <div style={{float: 'right'}}>
          <button type="button" onClick={function(){ console.log('click'); that.saveJob(that.state.job)}} className={'btn btn-success'}>Save</button>
          <button type="button" className={'btn btn-danger'}>Delete</button>
          <input type='text' onChange={that.updateDuplicateName.bind(that)} value={this.state.duplicateName} /> <span onClick={that.duplicate.bind(that)}>Duplicate</span></div>
        <h3>{this.state.job.name}</h3>
        {this.makeCheckbox('Async', 'async')}
        {this.makeCheckbox('Disabled', 'disabled')}
        <div className={'form-group'}>Description: <textarea style={{width: '100%'}} value={this.state.job.description} /></div>

        <div className={'form-group'}><label for='command'>Command:</label><textarea id='command' style={{width: '100%'}} value={this.state.job.command} /></div>
        <h5>Resources</h5>
        {that.makeInputField('CPUs', 'cpus')}
        {that.makeInputField('Mem', 'mem')}
        {that.makeInputField('Disk', 'disk')}
        <h5>Owner</h5>
        {that.makeInputField('Email', 'owner')}
        {that.makeInputField('Name', 'ownerName')}

        {
          this.state.job.container ? <div><h5>Container</h5>
          {that.makeInputField('Image', 'container.image')}
            </div> : null
        }

        <h5>Schedule</h5>
        {that.makeInputField('Schedule', 'schedule')}
        {that.makeInputField('Epsilon', 'epsilon')}
        {that.makeInputField('scheduleTimeZone', 'scheduleTimeZone')}

        <h5>Environment Variables</h5>
        {this.state.job.environmentVariables.sort((a,b)=>a.name.localeCompare(b.name)).map(function(envVar) {
          return <div><input type='text' value={envVar.name} style={{width: '300px'}} /> = <input type='text' value={envVar.value} style={{width: '350px'}} /><span onClick={function(){that.removeEnvVar(envVar)}}>X</span></div>
        })}

      </div>) : null;

    return (
      <div className={'container'}>
      <h2>Chronos</h2>
      <div class="row">
 
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.3/css/bootstrap.min.css" integrity="sha384-Zug+QiDoJOrZ5t4lssLdxGhVrurbmBWopoEl+M6BdEfwnCJZtKxi1KgxUyJq13dy" crossorigin="anonymous" />
        <div className="col-sm-4" style={{ border: '1px solid black'}}>
          {_.get(this, 'state.jobs', []).map(function(job) {
            return (<div onClick={function(){that.openJob(job)}} key={job.name}>{job.name}</div>);
          })}
        </div>
          
  <div class="col-sm-8">{job}</div>
</div>

      </div>
    )
  }
}